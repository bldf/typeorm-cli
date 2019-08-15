#!/usr/bin/env node
require('commander')
  .version(require('../package').version)

import "reflect-metadata";
import * as colors from "colors-console";
// const colors = require('colors-console')
// import program from "commander" ;
import { createConnection } from "typeorm";
import * as fs from "fs";
import * as swig from "swig-templates";
import * as mkdirp from "mkdirp";
const beautify = require('js-beautify').js;
const beautifyConfig = { // 格式化代码的配置
  "indent_size": "4",
  "indent_char": " ",
  "max_preserve_newlines": "-1",
  "preserve_newlines": false,
  "keep_array_indentation": false,
  "break_chained_methods": false,
  "indent_scripts": "normal",
  "brace_style": "none,preserve-inline",
  "space_before_conditional": true,
  "unescape_strings": false,
  "jslint_happy": false,
  "end_with_newline": false,
  "wrap_line_length": "0",
  "indent_inner_html": false,
  "comma_first": false,
  "e4x": false,
  "indent_empty_lines": false
};
const path = require("path");
const inquirer = require('inquirer');



let ormEntityTemplateSrc = '';

if (fs.existsSync(process.cwd() + '/ormEntityTemplate.ejs')) {//如果使用了自定义的模板
  ormEntityTemplateSrc = process.cwd() + '/ormEntityTemplate.ejs';
} else {
  ormEntityTemplateSrc = path.join(__dirname, '..', './ormEntityTemplate.ejs');
}

const template = swig.compileFile(ormEntityTemplateSrc);
const ormConfig = JSON.parse(fs.readFileSync(process.cwd() + '/ormconfig.json', 'UTF-8'));
delete ormConfig.entities;
delete ormConfig.migrations;
delete ormConfig.subscribers;
const TIME = Date.now();
/**
 * 将下划线命名转换为驼峰命名
 * @description 'order_name' => 'orderName'
 * @param {string} string 
 */
const camelCase = (string: string) => {
  return string.replace(/_([a-z])/g, function (all: string, letter: string) {
    return letter.toUpperCase();
  });
}
/**
 *获取实体类对应的ClassName
 *
 * @param {*} name
 * @returns
 */
const databaseTableNameToEntityClassName = (name: string) => {
  let arr = name.split('-');
  let str = camelCase(arr[arr.length - 1]);
  return str[0].toUpperCase() + str.substring(1);

}
/**
 *将数据库中的表名生成对应的路径
 *
 * @param {*} name
 * @returns
 */
const databaseTableToEntityClassPathName = (name: string) => {
  let arr = name.split('-');
  let path = '';
  if (arr.length > 1) {//如果使用了模块命名
    arr.pop();
    path = arr.join('/');
  }
  return path;
}


/**
 *将数据库的column修改后返回一个新的columns
 *将数据库中的下划线命名的字段改为驼峰命名
 *将数据库中的所有类型分为 number 或者 string 类型
 *
 * @param {databaseTableColumn[]} columns
 * @returns {databaseTableColumn[]}
 */
const databaseColumnToEntityColumnUpdate = (columns: databaseTableColumn[]): databaseTableColumn[] => {
  let newColumns = [];
  columns.forEach(d => {//将数据库中的下划线命名的字段改为驼峰命名
    let arr = d.databaseColumnType.match(/\d+/gi);
    d.columnName = camelCase(d.databaseColumnName);
    d.type = d.type == 'int' ? 'number' : 'string';
    if (d.columnName !== 'id') {
      newColumns.push(d);
    }
    if (arr && arr.length) {
      d.databaseColumnTypeLength = arr[0];
    }
  });
  return newColumns;
}


/**
 *判断数据库的字段是否包含  createTime 和 updateTime 这两个字段
 *
 * @param {databaseTableColumn[]} columns
 * @returns {{hasDatabaseColumnUpdateTime:boolean,hasDatabaseColumnCreateTime:boolean}}
 */
const getDatabaseHasUpdateTimeAndCreateTime = (columns: databaseTableColumn[]): { hasDatabaseColumnUpdateTime: boolean, hasDatabaseColumnCreateTime: boolean } => {
  let obj = {
    hasDatabaseColumnUpdateTime: false,
    hasDatabaseColumnCreateTime: false
  };
  columns.forEach(d => {
    if (d.columnName == 'updateTime') {
      obj.hasDatabaseColumnUpdateTime = true;
    }
    if (d.columnName == 'createTime') {
      obj.hasDatabaseColumnCreateTime = true;
    }
  });
  return obj;
}

/**
 *数据库表信息
 *
 * @interface databaseTable
 */
interface databaseTable {
  databaseTableName: string;
  tableComment: string;
}

/**
 *数据库表对应的字段信息
 *
 * @interface databaseTableColumn
 */
interface databaseTableColumn {
  databaseColumnName: string;
  databaseComment: string;
  databaseIsNull: string;
  databaseColumnType: string;
  databaseColumnTypeLength: string;
  columnName: string;
  type: string;
}

/**
 *检查文件是否和上一次的版本不一样, 如果不一样则备份到
 *
 * @param {string} outJs
 * @param {string} outPath
 * @param {*} outFileName
 */
const checkFileDifferent = (outJs: string, outPath: string, outFileName) => {
  let outFileNamePath = outPath + '/' + outFileName;
  if (fs.existsSync(outFileNamePath)) {//如果已经存在这个文件了
    let _outJs = fs.readFileSync(outFileNamePath, 'UTF-8');
    if (_outJs.replace(/Date.+/gi, '') !== outJs.replace(/Date.+/gi, '')) {//如果这次和上次的不一样，把上一次的拷贝过去。
      mkdirp(process.cwd() + '/dist/backup-typeorm-cli/', (err) => {//先递归创建文件夹
        if (err) {
          console.error(err)
        } else {
          fs.writeFileSync(process.cwd() + '/dist/backup-typeorm-cli/' + outFileName, _outJs);
          console.log(colors('yellow', `【${outFileName}】和上一次的版本不一样，已备份到/dist/backup-typeorm-cli文件夹中`));
        }
      })
    }
  }
}

/**
 *初始化函数
 *
 */
const initTypeormCli = async () => {
  const rest = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'cli',
      message: '如果生产的实体类，有过重新修改，新生成的会覆盖之前生成的,是否继续',
      default: true
    }
  ])
  if (rest.cli) {
    createConnection(ormConfig).then(async connection => {
      // 查询所有表名。
      const databaseTableNames = await connection.manager
        .query(`select table_name as databaseTableName,table_comment as tableComment from information_schema.tables where table_schema='${ormConfig.database}' and table_type='base table'`);
      console.log(colors('yellow', '数据库已连接成功。'))
      console.log(colors('yellow', '数据库中生成的实体类，会覆盖到现有的实体类中，如果有上次的版本和这次的版本不同，会做一次备份处理，是否继续'))
      databaseTableNames.forEach(async (table: databaseTable, index) => {
        let databaseTableName = table.databaseTableName;
        let outJs = '';
        let outPath = process.cwd() + '/' + ormConfig.cli.entitiesDir + '/' + databaseTableToEntityClassPathName(databaseTableName);//生成的实体类文件路径
        let outFileName = databaseTableNameToEntityClassName(databaseTableName) + '.ts';// 生产的实体类文件名字
        let columns: databaseTableColumn[] = await connection.manager
          .query(`
            select  column_name as databaseColumnName, column_comment as databaseComment,data_type as type ,IS_NULLABLE as databaseIsNull,COLUMN_TYPE as databaseColumnType from information_schema.columns
            where table_schema ='${ormConfig.database}'  and table_name = '${databaseTableName}'       
          `);
        columns = databaseColumnToEntityColumnUpdate(columns);
        outJs = template({
          entityClassName: databaseTableNameToEntityClassName(databaseTableName),
          tableComment: table.tableComment,
          date: new Date().toLocaleString(),
          author: ormConfig.author,
          databaseTableName,
          columns,
          addClassValidate: ormConfig.addClassValidate,
          ...getDatabaseHasUpdateTimeAndCreateTime(columns)
        });
        outJs = beautify(outJs, beautifyConfig);//格式化生成的代码 

        mkdirp(outPath, (err) => {//先递归创建文件夹
          if (err) {
            console.error(err)
          } else {
            checkFileDifferent(outJs, outPath, outFileName);
            fs.writeFileSync(outPath + '/' + outFileName, outJs);
            console.log(`数据库【${ormConfig.database}】中的表【${databaseTableName}】已生成`);
            if (index == databaseTableNames.length - 1) {
              connection.close();
              setTimeout(() => {
                let time = (Date.now() - TIME) / 1000;
                console.log(colors('cyan', `一共创建了【${databaseTableNames.length}】张表对应的实体类，一共用时【${time}】秒`));
              }, 20);
            }
          }
        })
      });
      console.log('数据库表连接成功。。。。正在创建 entity');
    }).catch(error => {
      console.log(colors('red', `程序报错了。。。。`));
      console.log(error)
    });
  }
}
initTypeormCli();

// program
//   .version('0.1.0')
//   .option('-p, --peppers', 'Add peppers')
//   .option('-P, --pineapple', 'Add pineapple')
//   .option('-b, --bbq-sauce', 'Add bbq sauce')
//   .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
//   .parse(process.argv);

// console.log('you ordered a pizza with:');
// if (program.peppers) console.log('  - peppers ================');
// if (program.pineapple) console.log('  - pineapple');
// if (program.bbqSauce) console.log('  - bbq');
// console.log('  - %s cheese', program.cheese);
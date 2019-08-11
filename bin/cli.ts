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
const path = require("path");
let ormEntityTemplateSrc = '';

if (fs.existsSync(process.cwd() + '/ormEntityTemplate.ejs')) {//如果使用了自定义的模板
  ormEntityTemplateSrc = process.cwd() + '/ormEntityTemplate.ejs';
} else {
  ormEntityTemplateSrc =path.join(__dirname, '..','./ormEntityTemplate.ejs') ;
}

const template = swig.compileFile(ormEntityTemplateSrc);
const ormConfig = JSON.parse(fs.readFileSync(process.cwd() + '/ormconfig.json', 'UTF-8'));
delete ormConfig.entities ;
delete ormConfig.migrations ;
delete ormConfig.subscribers ;
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
  columnName: string;
  comment: string;
  type: string;
}


createConnection(ormConfig).then(async connection => {
  // 查询所有表名。
  const databaseTableNames = await connection.manager
    .query(`select table_name as databaseTableName,table_comment as tableComment from information_schema.tables where table_schema='${ormConfig.database}' and table_type='base table'`);
  databaseTableNames.forEach(async (table: databaseTable, index) => {
    let databaseTableName = table.databaseTableName;
    let outJs = '';
    let newColumns = [];
    let columns: databaseTableColumn[] = await connection.manager
      .query(`
            select  column_name as databaseColumnName, column_comment as comment,data_type as type from information_schema.columns
            where table_schema ='${ormConfig.database}'  and table_name = '${databaseTableName}'       
          `);
    columns.forEach(d => {//将数据库中的下划线命名的字段改为驼峰命名
      d.columnName = camelCase(d.databaseColumnName);
      d.type = d.type == 'int' ? 'number' : 'string';
      if (d.columnName !== 'id') {
        newColumns.push(d);
      }
    });
    outJs = template({
      entityClassName: databaseTableNameToEntityClassName(databaseTableName),
      tableComment: table.tableComment,
      date: new Date().toLocaleString(),
      author: ormConfig.author,
      databaseTableName,
      columns: newColumns
    });
    mkdirp(process.cwd() + '/' + ormConfig.cli.entitiesDir + '/' + databaseTableToEntityClassPathName(databaseTableName), (err) => {//先递归创建文件夹
      if (err) {
        console.error(err)
      } else {
        fs.writeFile(process.cwd() + '/' + ormConfig.cli.entitiesDir + '/' + databaseTableToEntityClassPathName(databaseTableName) + '/' + databaseTableNameToEntityClassName(databaseTableName) + '.ts', outJs, (err) => {
          if (err) throw err;
          console.log(`数据库表【${databaseTableName}】已生成`);

          if (index == databaseTableNames.length - 1) {
            connection.close();
            let time = (Date.now() - TIME) / 1000;
            console.log(colors('cyan', `一共生产【${databaseTableNames.length}】张表，一共用时【${time}】秒`));
          }
        });
      }
    })
  });
  console.log('数据库表连接成功。。。。正在创建 entity');
}).catch(error => {
  console.log(colors('cyan', `程序报错了。。。。`));
  console.log(error)
});

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
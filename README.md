
# typeorm-cli
读取数据库表，自动生成[实体类](https://typeorm.io/#/entities)
### 1.全局安装（目前只是测试了mysql）

```
npm nstall -g typeorm-cli
```
### 2.使用
    控制台执行  typeorm-cli
### 3.配置项
ormconfig.json。(在[typeorm](https://typeorm.io/#/using-ormconfig)的配置中添加即可)
```json
  {
   "type": "mysql",
   "host": "192.168.11.203",
   "port": 3306,
   "username": "root",
   "password": "admin123",
   "database": "db_typeorm",
   "logging": false,
   "entities": [
      "entity/**/*.ts"
   ],
   "migrations": [
      "src/migration/**/*.ts"
   ],
   "subscribers": [
      "src/subscriber/**/*.ts"
   ],
   "cli": {
      "entitiesDir": "dist/entity",
      "migrationsDir": "build/migration",
      "subscribersDir": "build/subscriber"
   },
   "author": "bldf",//生成实体类的作者
   "addClassValidate": true//是否添加class的验证
}
```
### 4.生产的实体类模板，自定义
默认模板如下，采用ejs模板渲染引擎

```typescript
import { {% if hasDatabaseColumnCreateTime %}BeforeUpdate, {% endif %}{% if hasDatabaseColumnCreateTime %}BeforeInsert,{% endif %} Entity, PrimaryGeneratedColumn, Column } from "typeorm";
{% if addClassValidate %}import { Max,IsNotEmpty } from "class-validator";{% endif %}
/**
 * {{tableComment||databaseTableName}}
 * @Date {{date}}
 * @author {{author}}
 * @export
 * @class {{entityClassName}}
 */
@Entity({
    name: '{{databaseTableName}}'
})
export class {{entityClassName}} {

    /**
     * 主键 id
     *
     * @type { number }
     * @memberof {{entityClassName}}
     */
    @PrimaryGeneratedColumn()
    id: number;


    {% for column in columns %}
    /**
     * {{column.databaseComment || column.columnName}}
     *
     * @type { {{column.type}} }
     * @memberof {{entityClassName}}
     */
    @Column({name: '{{column.databaseColumnName}}'})
    
    {% if addClassValidate&&column.databaseIsNull=='NO' %}
    @IsNotEmpty({ message:'【{{column.databaseComment || column.columnName}}】不能为空' }) 
    {% endif %}

    {% if addClassValidate&&column.databaseColumnTypeLength %}
    @Max({{ column.databaseColumnTypeLength }},{ message:'【{{ column.databaseComment || column.columnName }}】长度不能超过{{column.databaseColumnTypeLength}}' })
    {% endif %}
    
    {{column.columnName}}: {{column.type}};
    {% endfor %}



    {% if hasDatabaseColumnUpdateTime %}
    /**
     *在对数据库表【{{tableComment}}】({{databaseTableName}})修改的时候执行
     *
     * @memberof {{entityClassName}}
     */
    @BeforeUpdate()
    beforeUpdateTime() {
        let  arr = new Date().toLocaleString().match(/\d+/gi) ; 
        this.updateTime  = [arr![0],arr![1].padStart(2, '0'),arr![2].padStart(2, '0')].join('-')+' '+[arr![3].padStart(2, '0'),arr![4].padStart(2, '0'),arr![5].padStart(2, '0')].join(':') ;
    }
    {% endif %}

    {% if hasDatabaseColumnCreateTime %}
    /**
     *在对数据库表【{{tableComment}}】({{databaseTableName}})插入的时候执行
     *
     * @memberof {{entityClassName}}
     */
    @BeforeInsert()
    beforeCreateTime() {
        let  arr = new Date().toLocaleString().match(/\d+/gi) ; 
        let time = [arr![0],arr![1].padStart(2, '0'),arr![2].padStart(2, '0')].join('-')+' '+[arr![3].padStart(2, '0'),arr![4].padStart(2, '0'),arr![5].padStart(2, '0')].join(':') ;
        this.createTime = this.updateTime = time ;
    }
    {% endif %}
}
```

 
### 4.生成的规则
##### 表生成的规则
1. 模块采用中横线区分，表名采用下划线区分，
    2. 数据库表名为：obj6-bg-bg_info ，实体类为：obj6/bg/BgInfo.ts
##### 表字段生成的规则

1. 采用下划线区分
    2.  数据库表字段为：create_time,实体类为：createTime
    
### 生成实体类的时候需要注意
生成实体类的时候，会覆盖原有的实体类，如果这一次和上一次出现不同，会备份一次到 dist/backup-typeorm-cli/* 中

### Demo:数据库表为
![image](https://github.com/bldf/typeorm-cli/blob/master/obj6-bg-bg_info.png)
```
CREATE TABLE `obj6-bg-bg_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `operator` int(11) NOT NULL COMMENT '操作人',
  `description` varchar(255) NOT NULL COMMENT '描述',
  `update_time` varchar(255) NOT NULL COMMENT '修改时间',
  `create_time` varchar(255) NOT NULL COMMENT '创建时间',
  `content` varchar(255) NOT NULL COMMENT '背景内容',
  `field1` varchar(255) NOT NULL COMMENT '备用字段1',
  `field2` varchar(255) NOT NULL COMMENT '备用字段2',
  `field3` varchar(255) NOT NULL COMMENT '备用字段3',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='背景基本信息表'
```
### Demo:生成的实体类为：obj6/bg/BgInfo.ts
    
```typescript
import { BeforeUpdate, BeforeInsert, Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Max, IsNotEmpty } from "class-validator";
/**
 * 背景基本信息表
 * @Date 2019-8-15 18:05:38
 * @author YXL
 * @export
 * @class BgInfo
 */
@Entity({
    name: 'obj6-bg-bg_info'
})
export class BgInfo {
    /**
     * 主键 id
     *
     * @type { number }
     * @memberof BgInfo
     */
    @PrimaryGeneratedColumn()
    id: number;
    /**
     * 操作人
     *
     * @type { number }
     * @memberof BgInfo
     */
    @Column({ name: 'operator' })
    @IsNotEmpty({ message: '【操作人】不能为空' })
    @Max(8, { message: '【操作人】长度不能超过8' })
    operator: number;
    /**
     * 描述
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({ name: 'description' })
    @IsNotEmpty({ message: '【描述】不能为空' })
    @Max(255, { message: '【描述】长度不能超过255' })
    description: string;
    /**
     * 修改时间
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({ name: 'update_time' })
    @IsNotEmpty({ message: '【修改时间】不能为空' })
    @Max(50, { message: '【修改时间】长度不能超过50' })
    updateTime: string;
    /**
     * 创建时间
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({ name: 'create_time' })
    @IsNotEmpty({ message: '【创建时间】不能为空' })
    @Max(50, { message: '【创建时间】长度不能超过50' })
    createTime: string;
    /**
     * 背景内容
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({ name: 'content' })
    @IsNotEmpty({ message: '【背景内容】不能为空' })
    @Max(255, { message: '【背景内容】长度不能超过255' })
    content: string;
    /**
     * 备用字段1
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({ name: 'field1' })
    @Max(255, { message: '【备用字段1】长度不能超过255' })
    field1: string;
    /**
     * 备用字段2
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({ name: 'field2' })
    @Max(255, { message: '【备用字段2】长度不能超过255' })
    field2: string;
    /**
     * 备用字段3
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({ name: 'field3' })
    @Max(255, { message: '【备用字段3】长度不能超过255' })
    field3: string;
    /**
     *在对数据库表【背景基本信息表】(obj6-bg-bg_info)修改的时候执行
     *
     * @memberof BgInfo
     */
    @BeforeUpdate()
    beforeUpdateTime() {
        let arr = new Date().toLocaleString().match(/\d+/gi);
        this.updateTime = [arr![0], arr![1].padStart(2, '0'), arr![2].padStart(2, '0')].join('-') + ' ' + [arr![3].padStart(2, '0'), arr![4].padStart(2, '0'), arr![5].padStart(2, '0')].join(':');
    }
    /**
     *在对数据库表【背景基本信息表】(obj6-bg-bg_info)插入的时候执行
     *
     * @memberof BgInfo
     */
    @BeforeInsert()
    beforeCreateTime() {
        let arr = new Date().toLocaleString().match(/\d+/gi);
        let time = [arr![0], arr![1].padStart(2, '0'), arr![2].padStart(2, '0')].join('-') + ' ' + [arr![3].padStart(2, '0'), arr![4].padStart(2, '0'), arr![5].padStart(2, '0')].join(':');
        this.createTime = this.updateTime = time;
    }
}
```

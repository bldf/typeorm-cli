
# typeorm-cli
读取数据库表，自动生成[实体类](https://typeorm.io/#/entities)
### 1.全局安装（目前只是测试了mysql）

```
npm nstall -g typeorm-cli
```
### 2.使用
    typeorm-cli
### 3.配置项
1. ormconfig.json。读取数据库的配置，默认读取当前项目中的ormconfig.json，配置就是 typeorm 的配置 ， 多了一个key:author ；创建者的名字
2. ormEntityTemplate.ejs 。 配置生成的实体类模板。默认模板如下，如有需要可自己进行配置，模板渲染引擎采用，ejs引擎。（如果采用默认此配置，请忽略）
### 4.生成的规则
##### 表生成的规则
1. 模块采用中横线区分，表名采用下划线区分，
    2. 数据库表名为：obj6-bg-bg_info ，实体类为：BgInfo.ts
##### 表字段生成的规则

1. 采用下划线区分
    2.  数据库表字段为：create_time,实体类为：createTime

### 默认的 ormEntityTemplate.ejs
```
 import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * {{tableComment}}
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
     * {{column.comment}}
     *
     * @type { {{column.type}} }
     * @memberof {{entityClassName}}
     */
    @Column({
        name: '{{column.databaseColumnName}}'
    })
    {{column.columnName}}: {{column.type}};
    {% endfor %}
}

```
### Demo:数据库表为
![image](https://github.com/bldf/typeorm-cli/blob/master/obj6-bg-bg_info.png)
### 生成的实体类为：
    
```
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * 背景基本信息表
 * @Date 2019-8-11 1:54:03 PM
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
    @Column({
        name: 'operator'
    })
    operator: number;
    
    /**
     * 描述
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({
        name: 'description'
    })
    description: string;
    
    /**
     * 修改时间
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({
        name: 'update_time'
    })
    updateTime: string;
    
    /**
     * 创建时间
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({
        name: 'create_time'
    })
    createTime: string;
    
    /**
     * 背景内容
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({
        name: 'content'
    })
    content: string;
    
    /**
     * 备用字段1
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({
        name: 'field1'
    })
    field1: string;
    
    /**
     * 备用字段2
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({
        name: 'field2'
    })
    field2: string;
    
    /**
     * 备用字段3
     *
     * @type { string }
     * @memberof BgInfo
     */
    @Column({
        name: 'field3'
    })
    field3: string;
    
}

```


# typeorm-cli
读取数据库表，自动生成[实体类](https://typeorm.io/#/entities)
### 1.全局安装

```
npm nstall -g typeorm-cli
```
### 2.使用
    typeorm-cli
### 3.配置项
1. ormconfig.json。读取数据库的配置，默认读取当前项目中的ormconfig.json，配置就是 typeorm 的配置 ， 多了一个key:author ；创建者的名字
2. ormEntityTemplate.ejs 。 配置生成的实体类模板。默认模板如下，如有需要可自己进行配置，模板渲染引擎采用，ejs引擎。（如果采用默认此配置，请忽略）
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

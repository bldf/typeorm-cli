var inquirer = require('inquirer')
inquirer.prompt([
  {
    type: 'confirm',
    name: 'cli',
    message: '如果生产的实体类，有过重新修改，新生成的会覆盖之前生成的,是否继续',
    default: true
  }
]).then((answers) => {
    if(answers.cli){
        console.log('ok') ;
    }else{
        console.log('no') ;
    }
//   console.log('结果为:')
//   console.log(answers)
})
// console.log('后边的代码继续执行')
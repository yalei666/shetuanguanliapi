var express    = require('express');
var router     = express.Router();
var db         = require('../conf/db');
var mysql      = require('mysql');
var multiparty = require('multiparty'); 
/* GET users listing. */
router.get('/', function(req, res, next) {
	db.query('select * from userinfo',function(results,fields){
		res.send({results});
	})
  //res.send('respond with a resource');
});
router.get('/login', function(req, res, next) {
	var account  = req.query.xuehao;
	var password = req.query.password;
	var sqlstr   = "select id from userinfo where xuehao = "+mysql.escape(account)+" and password = "+mysql.escape(password);
	db.query(sqlstr,[],function(results,fields){
		if(results.length != 2){
			var resultsObj = {
				resultCode:1,
				resultMsg:'登陆成功',
				data:{
					results
				}
			};
		}else{
			var resultsObj = {
				resultCode:0,
				resultMsg:'登陆失败',
				data:{
					
				}
			};			
		}
		res.send(resultsObj);
	})
});
router.get('/getUserInfo',function(req,res,next){
	var userId   = req.query.userId;
	var sqlstr   = "select * from userinfo where id = "+mysql.escape(userId);
	db.query(sqlstr,[],function(results,fields){
		if(results){
			var resultsObj = {
				resultCode:1,
				resultMsg:'查询成功',
				data:{
					results
				}
			};
		}
		res.send(resultsObj);
	})
});
router.post('/wanshanxinxi',function(req,res,next){
	var form = new multiparty.Form();
	form.uploadDir = 'upload';
	form.parse(req,function(err,fields,files){
		var imgstr     = "localhost:3000/upload/";
		var imgname    = files.file[0].path.match(/upload(\S*)/)[1].slice(1);
		var imgaddress = imgstr+imgname;
		var sqlstr     = "update userinfo set touxiangpath = ?,userclass=? where ";
		Object.keys(fields).forEach(function(name){
    		console.log('got field named ' + name,'got field valued ' + fields[name]);
  		});


		console.log(fields);
		
		console.log(imgaddress);
	})
});


router.post('/zhuce',function(req,res,next){
	var sqlstr = "INSERT INTO userinfo set ?";
	db.query(sqlstr,req.body,function(results,fields){
		if(results.length != 2){
			var resultsObj = {
				resultCode:1,
				resultMsg:'注册成功',
				data:{
					results
				}
			};			
		}else{
			var resultsObj = {
				resultCode:0,
				resultMsg:'注册失败',
				data:{
					results
				}
			};			
		}
		res.send(resultsObj);
	});
		
})
module.exports = router;

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
router.post('/login', function(req, res, next){
	var account  = req.body.xuehao;
	var password = req.body.password;
	var sqlstr   = "select id from userinfo where xuehao = "+mysql.escape(account)+" and password = "+mysql.escape(password)
	db.query(sqlstr,[],function(results,fields){
		if(results.length != 0){
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
		if(results.length != 0){
			var resultsObj = {
				resultCode:1,
				resultMsg:'查询成功',
				data:{
					results,
					qianduanjiegou:req.query.qianduan!=='false'? false : [{
							label:'首页',
							path:'/index/seelifeCirel',
							iconClass:'iconfont icon-shouye',
							authority:true,
							children:false		
						},{
							label:'全校社团结构管理',
							iconClass:'iconfont icon-shouye',
							authority:true,
							children:[{
								label:'社团基本信息',
								path:'/shetuan/partyList',
								authority:results[0].userrole == 'admin'?true:false,								
							},{
								label:'社团部门结构',
								path:'/shetuan/sectioninfo',
								authority:results[0].userrole == 'admin'?true:false,								
							}]		
					},{
							label:'本社团事务管理',
							iconClass:'iconfont icon-shouye',
							authority:true,
							children:[{
								label:'入社申请管理',
								path:'/applyjoin/handleshetuanjoin',
								authority:true,								
							}]							
					}],
					permissions:req.query.qianduan!=='false'? false : {
						'/index/seelifeCirel':true,	
						'/shetuan/partyList':results[0].userrole == 'admin'?true:false,	
						'/shetuan/sectioninfo':results[0].userrole == 'admin'?true:false,
						'/applyjoin/handleshetuanjoin':true,
						'/applyjoin/handlehuodongjoin':true	
					}	
				}
			};			
		}else{
			var resultsObj = {
				resultCode:0,
				resultMsg:'查询失败',
				data:{
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
		var imgstr     = "/api/upload/";
		var imgname    = files.file[0].path.match(/upload(\S*)/)[1].slice(1);
		var imgaddress = imgstr+imgname;
		var sqlstr     = "update userinfo set realname=?,userclass=?,touxiangpath = ?  where id = ?";
		var newArr     = [];
		Object.keys(fields).forEach(function(name){
    		newArr.push(fields[name][0])
  		});
  		newArr.splice(2,0,imgaddress);
		db.query(sqlstr,newArr,function(results,fields){
			if(results.affectedRows == 1){
				var resultsObj = {
					resultCode:1,
					resultMsg:'修改成功',
					data:{
						results
					}
				};			
			}else{
				var resultsObj = {
					resultCode:0,
					resultMsg:'修改失败',
					data:{
						results
					}
				};			
			}
			res.send(resultsObj);
		});
	})
});
router.post('/zhuce',function(req,res,next){
	var sqlstr = "INSERT INTO userinfo set ?";
	db.query(sqlstr,req.body,function(results,fields){
		if(results.affectedRows == 1){
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
});


module.exports = router;

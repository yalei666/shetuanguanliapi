var express    = require('express');
var router     = express.Router();
var db         = require('../conf/db');
var mysql      = require('mysql');
var multiparty = require('multiparty'); 

router.post('/addNewSheTuan',function(req,res,next){
	var form = new multiparty.Form();
	form.uploadDir = 'upload'
	form.parse(req,function(err,fields,files){
		var imgstr     = "/api/upload/"
		var imgname    
		var imgaddress 
		var sqlstr 

		if(fields['id'][0] == 'null'){
			sqlstr     = "INSERT INTO shetuaninfo set ?"						
		}else{
			sqlstr     = "UPDATE shetuaninfo set name = :name,biaoyu=:biaoyu,jianjie=:jianjie,touxiangdizhi=:touxiangdizhi,shuyu=:shuyu where id=:id"
		}		
		if(files.file){
			imgname    = files.file[0].path.match(/upload(\S*)/)[1].slice(1)
			imgaddress = imgstr+imgname
			fields.touxiangdizhi = [imgaddress]

		}else{
			sqlstr     = "UPDATE shetuaninfo set name = :name,biaoyu=:biaoyu,jianjie=:jianjie,shuyu=:shuyu where id=:id"
		}
		let getxuehaoArr = new Promise (function(resolve,reject){
			db.query('select GROUP_CONCAT(realname) as chairman from userinfo where xuehao in ('+fields['chairmanxuehao'][0]+')',[],function(results,fields){
				if(results.length != 0){
					console.log(results)
					resolve(results)
				}else{
					reject(fields)
				}
			});
		})
		getxuehaoArr.then(function(chairmanres){
			fields.chairman = [chairmanres[0].chairman]
			Object.keys(fields).forEach(function(name){
	    		fields[name] = fields[name][0]
	  		});	
			if(fields['id'] == 'null'){
				delete fields.id
		  		db.query(sqlstr,fields,function(results,fields){
					if(results.affectedRows == 1){
						var ResultsObj = {
								resultCode:1,
								resultMsg:'创建成功',
								data:{
									results
								}
						};			
					}else{
						var ResultsObj = {
								resultCode:0,
								resultMsg:'创建失败',
								data:{
									results
								}
						};			
					}
					res.send(ResultsObj) 			
		  		})						
			}else{
		  		db.update(sqlstr,fields,function(results,fields){
					if(results.affectedRows == 1){
						var ResultsObj = {
								resultCode:1,
								resultMsg:'修改成功',
								data:{
									results
								}
						};			
					}else{
						var ResultsObj = {
								resultCode:0,
								resultMsg:'修改失败',
								data:{
									results
								}
						};			
					}
					res.send(ResultsObj) 			
		  		})			
			} 	  				
		}).catch(function(rej){
			console.log(rej)
		})

 		
	})	
})

router.post('/getSheTuanList',function(req,res,next){
	var canshu      = req.body.canshu
	var currPage    = req.body.currPage		
	var pageSize    = req.body.pageSize
	var startPage   = (currPage-1)*pageSize
	var qiansqlstr  = "select * from shetuaninfo " 
	var wheresqlstr = ''
	if(canshu){
		 wheresqlstr = " where  mingcheng = %"+mysql.escape(canshu)+"%"
	} 
	var tiaoshusqlstr = " limit "+startPage+","+pageSize
	var zongsqlstr    = qiansqlstr+wheresqlstr+tiaoshusqlstr 
	var totalsqlstr   = "select count(*) as total from shetuaninfo "+(wheresqlstr?wheresqlstr:'')
	var resultObj     = {
		resultCode: 1,
		resultMsg:  "查询成功",
		resultData: null,
		total:      null							
	}
	let chaxunlist    = new Promise(function(resolve,reject){
		db.query(zongsqlstr,[],function(results,fields){
			if(results.length != 0){
				resolve(results)
			}
		})
	});
	let gettotal     = new Promise(function(resolve,reject){
		db.query(totalsqlstr,[],function(results,fields){
			if(results.length != 0){
				resolve(results)
			}					
		})
	})
	Promise.all([chaxunlist,gettotal]).then((result)=>{
		resultObj.resultData = result[0]  
		resultObj.total      = result[1][0].total
		res.send(resultObj)  
	}).catch((error)=>{
		console.log(2,result)
	})
})

router.get('/deleteshetuan',function(req,res,next){
	var deleteid = req.query.id
	db.query('DELETE FROM shetuaninfo WHERE id = '+mysql.escape(deleteid),[],function(results,reject){
		if(results.affectedRows == 1){
			var ResultsObj = {
				resultCode:1,
				resultMsg:'删除成功',
			};			
		}else{
			var ResultsObj = {
				resultCode:0,
				resultMsg:'删除失败',
			};			
		}
		res.send(ResultsObj) 
	})
})

router.post('/applyJoinOne',function(req,res,next){
	//var applytext    	  = req.body.applytext	
	var sqlstr            = "INSERT INTO join_party_info set ?"
	let insertinbenbiao   = new Promise(function(resolve,reject){

		db.query(sqlstr,req.body,function(results,fields){
			if(results.affectedRows == 1){
				resolve(results.insertId)	
			}else{
				reject('insertinbenbiao')			
			}		
		})
	})
	let insertflowObj            = new Object()
	insertflowObj.moduleName     = "joinparty" 
	insertflowObj.handleTime     = req.body.applytime 
	insertflowObj.status         = 0
	let insertlogObj             = new Object()
	insertlogObj.step            = 0
	insertlogObj.optTime         = req.body.applytime
	insertlogObj.optPersonName   = req.body.applystudentname
	insertlogObj.optPersonId = req.body.applystudentid
	insertlogObj.moduleName      = "joinparty" 
 	let nexthandleren    = new Promise(function(resolve,reject){
		var sqlstr = "select chairman,chairmanxuehao from sectioninfo where id = "+mysql.escape(req.body.joinsectionid)
		db.query(sqlstr,[],function(results,fields){

			if(results.length != 0){
				resolve(results)	
			}else{
				reject(fields)			
			}		
		})				
	}) 

	Promise.all([insertinbenbiao,nexthandleren]).then((yiresult)=>{
		insertflowObj.nextCheckPersonName   = yiresult[1][0].chairman.split(",")
		insertflowObj.nextCheckPersonName   = insertflowObj.nextCheckPersonName[0]			
		insertflowObj.nextCheckPersonXuehao = yiresult[1][0].chairmanxuehao.split(",")				
		insertflowObj.nextCheckPersonXuehao = insertflowObj.nextCheckPersonXuehao[0]
		insertflowObj.mid                   = yiresult[0]
		insertlogObj.mid                    = yiresult[0]
		let insertflow       = new Promise(function(resolve,reject){
			db.query("INSERT INTO shetuan_flow set ?",insertflowObj,function(flowresult,flowfields){
				resolve(flowresult)
			})				
		})
		let insertlog        = new Promise(function(resolve,reject){
			db.query("INSERT INTO shetuan_log set ?",insertlogObj,function(logresult,logfields){
				resolve(logresult)
			})
		})		
		Promise.all([insertflow,insertlog]).then((allresult)=>{
			if(allresult[0].affectedRows == 1 &&allresult[1].affectedRows == 1){
				var ResultsObj = {
						resultCode:1,
						resultMsg:'修改成功',
						data:{
							
						}
				};					
			}else{
				var ResultsObj = {
						resultCode:0,
						resultMsg:'修改失败',
						data:{
						}
				};					
			}
			res.send(ResultsObj) 
		}).catch((erreject)=>{
			console.log('erreject',erreject)	
		})
	}).catch((yireject)=>{
		console.log('yireject',yireject)
	})
})

router.get('/getPartyTree',function(req,res,next){
	var chaxunshetuansql  = "select * from shetuaninfo"
	var resultObj         = {
		resultCode: 1,
		resultMsg:  "查询成功",
		resultData: null,							
	}	
	db.query(chaxunshetuansql,[],function(results,fields){
		if(results.length != 0){
			resultObj.resultData = results
			res.send(resultsObj);			
		}				
	})	
})

//加入社团时选择部门
router.get('/getSectionList',function(req,res,next){
	var shetuanid = req.query.id
	var resultObj     = {
		resultCode: 1,
		resultMsg:  "查询成功",
		resultData: null,							
	}	
	db.query("select * from sectioninfo where partyid = "+mysql.escape(shetuanid),[],function(results,fields){
		resultObj.resultData = results
		res.send(resultObj)
	})	
})

//获得社团部门树 获取第一级 社团级
router.get('/getTreeListYi',function(req,res,next){
	var resultObj     = {
		resultCode: 1,
		resultMsg:  "查询成功",
		resultData: null,							
	}	
	db.query('select * from shetuaninfo',[],function(results,fields){
		for(var shetuan of results){
			shetuan.children = []
		}
		resultObj.resultData = results
		res.send(resultObj)
	})	
})

//获得社团部门树 获取第二级 部门级
router.get('/getTreeListEr',function(req,res,next){
	var id = req.query.id 
	var resultObj     = {
		resultCode: 1,
		resultMsg:  "查询成功",
		resultData: null,							
	}	
	db.query('select * from sectioninfo where partyid = '+mysql.escape(id),[],function(results,fields){
		resultObj.resultData = results
		res.send(resultObj)
	})	
})

//获得社团部门树 获取第三级 小组级
router.get('/getTreeListSan',function(req,res,next){
	var id = req.query.id 
	var resultObj     = {
		resultCode: 1,
		resultMsg:  "查询成功",
		resultData: null,							
	}	
	db.query('select * from sectioninfo where id = '+mysql.escape(id),[],function(results,fields){
		resultObj.resultData = results
		res.send(resultObj)
	})	
})

//删除部门 
router.get('/deletesection',function(req,res,next){
	var deleteid = req.query.id
	db.query('DELETE FROM sectioninfo WHERE id = '+mysql.escape(deleteid),[],function(results,reject){
		if(results.affectedRows == 1){
			var ResultsObj = {
				resultCode:1,
				resultMsg:'删除成功',
			};			
		}else{
			var ResultsObj = {
				resultCode:0,
				resultMsg:'删除失败',
			};			
		}
		res.send(ResultsObj) 
	})	
})

//新增和编辑部门信息
router.post('/addNewSection',function(req,res,next){
	var form = new multiparty.Form();
	form.uploadDir = 'upload'
	form.parse(req,function(err,fields,files){
		var imgstr     = "/api/upload/"
		var imgname    
		var imgaddress 
		var sqlstr 
		if(fields['id'][0] == 'null'){
			sqlstr     = "INSERT INTO sectioninfo set ?"						
		}else{
			sqlstr     = "UPDATE sectioninfo set name = :name,imgaddress=:imgaddress where id=:id"
		}		
		if(files.file){
			imgname    = files.file[0].path.match(/upload(\S*)/)[1].slice(1)
			console.log("imgname:",imgname)
			console.log("imgstr:",imgstr)
			imgaddress = imgstr+imgname
			fields.imgaddress = [imgaddress]
		}else{
			sqlstr     = "UPDATE sectioninfo set name = :name where id=:id"
		}

		let getxuehaoArr = new Promise (function(resolve,reject){
			db.query('select GROUP_CONCAT(realname) as chairman from userinfo where xuehao in ('+fields['chairmanxuehao'][0]+')',[],function(results,fields){
				if(results.length != 0){
					console.log(results)
					resolve(results)
				}else{
					reject(fields)
				}
			});
		})
		getxuehaoArr.then(function(chairmanres){
			fields.chairman = [chairmanres[0].chairman]
			Object.keys(fields).forEach(function(name){
	    		fields[name] = fields[name][0]
	  		});	
			if(fields['id'] == 'null'){
				delete fields.id
		  		db.query(sqlstr,fields,function(results,fields){
					if(results.affectedRows == 1){
						var ResultsObj = {
								resultCode:1,
								resultMsg:'创建成功',
								data:{
									results
								}
						};			
					}else{
						var ResultsObj = {
								resultCode:0,
								resultMsg:'创建失败',
								data:{
									results
								}
						};			
					}
					res.send(ResultsObj) 			
		  		})						
			}else{
		  		db.update(sqlstr,fields,function(results,fields){
					if(results.affectedRows == 1){
						var ResultsObj = {
								resultCode:1,
								resultMsg:'修改成功',
								data:{
									results
								}
						};			
					}else{
						var ResultsObj = {
								resultCode:0,
								resultMsg:'修改失败',
								data:{
									results
								}
						};			
					}
					res.send(ResultsObj) 			
		  		})			
			}									
		}).catch(function(){
			console.log(rej)
		}) 		
	})	
})


//新增社团时根据学号获取负责人
router.get('/selectChairMan',function (req,res,next) {
	console.log(req.query.xuehao)
	var sqlstr = 'select realname,xuehao from userinfo where xuehao = '+mysql.escape(req.query.xuehao) 
	
	db.query(sqlstr,[],function(results,reject){
		if(results.length != 0){
			var ResultsObj = {
				resultCode:1,
				resultMsg:'查询成功',
				resultData:results
			};			
		}else{
			var ResultsObj = {
				resultCode:0,
				resultMsg:'无匹配人员',
			};			
		}		
		res.send(ResultsObj)
	})
})

//根据学号字符串 形成chairmanoptions

router.get('/fengjiexuehaostr',function(req,res,next){
	var xuehaostr  = req.query.xuehaostr
	var sqlstr     = 'select xuehao,realname from userinfo where xuehao in ('+xuehaostr+')'
	db.query(sqlstr,[],function(results,reject){
		if(results.length != 0){
			var ResultsObj = {
				resultCode:1,
				resultMsg:'查询成功',
				resultData:results
			};			
		}else{
			var ResultsObj = {
				resultCode:0,
				resultMsg:'无匹配人员',
			};			
		}		
		res.send(ResultsObj)				
	})

})


// 获取 学生端申请加入社团 列表 
router.get('/getApplyPartyList',function(req,res,next){
	var querid = req.query.id
	var sqlstr = "select h1.joinpartyname,h2.name,h1.applytime,h1.status,max(step) as step from  	( SELECT * from join_party_info where applystudentid = ? ) as h1  	 LEFT JOIN 	( SELECT name,id from sectioninfo ) as h2  on h1.joinsectionid = h2.id left join (SELECT step,mid from shetuan_log ) as h3 on h1.id = h3.mid"
	db.query(sqlstr,[querid],function(results,fields){
		if(results.length != 0){
			var ResultsObj = {
				resultCode:1,
				resultMsg:'查询成功',
				resultData:results
			};			
		}else{
			var ResultsObj = {
				resultCode:0,
				resultMsg:'无匹配人员',
			};			
		}		
		res.send(ResultsObj)		
	})
})

// 获取 社团端 申请加入社团列表 houtai:handleshetuanjoinlist
router.post('/handleshetuanjoinlist',function(req,res,next){
	var role 	    = req.body.role
	var shetuanid   = req.body.shetuanid 
	var currPage    = req.body.currPage		
	var pageSize    = req.body.pageSize
	var startPage   = (currPage-1)*pageSize
	var qiansqlstr  = 'select h1.id,h1.applystudentname,h1.applystudentclass,h2.name as joinsectionname,h1.applytime,h1.status,h3.nextCheckPersonXuehao,h1.applytext from ((select * from join_party_info) as h1 left join (SELECT id,name from sectioninfo) as h2  on h1.joinsectionid = h2.id)  left join (SELECT mid,nextCheckPersonXuehao from shetuan_flow) as h3  on h1.id = h3.mid' 
	var housqlstr   = '  limit '+startPage+","+pageSize
	var resultObj   = {
		resultCode: 1,
		resultMsg:  "查询成功",
		resultData: null,
		total:      null							
	}	
	if(role == "admin"){
		var selectsql = qiansqlstr+housqlstr
		var wheresqlstr = '' 
		var totalsqlstr = "select count(*) as total from join_party_info "+(wheresqlstr?wheresqlstr:'')
		let chaxunlist    = new Promise(function(resolve,reject){
			db.query(selectsql,[],function(results,fields){
				if(results.length != 0){
					resolve(results)
				}
			})
		});	
		let gettotal     = new Promise(function(resolve,reject){
			db.query(totalsqlstr,[],function(results,fields){
				if(results.length != 0){
					resolve(results)
				}					
			})
		})
		Promise.all([chaxunlist,gettotal]).then((result)=>{
			resultObj.resultData = result[0]  
			resultObj.total      = result[1][0].total
			res.send(resultObj)  
		}).catch((error)=>{
			console.log(2,error)
		})					
	}else{
		var wheresqlstr = 'where joinpartyid = ?'
		var selectsql   = qiansqlstr+wheresqlstr+housqlstr
		var totalsqlstr = "select count(*) as total from join_party_info "+(wheresqlstr?wheresqlstr:'')
		let chaxunlist  = new Promise(function(resolve,reject){
			db.query(selectsql,[shetuanid,startPage,pageSize],function(results,fields){
				if(results.length != 0){
					resolve(results)
				}
			})
		});	
		let gettotal     = new Promise(function(resolve,reject){
			db.query(totalsqlstr,[],function(results,fields){
				if(results.length != 0){
					resolve(results)
				}					
			})
		})
		Promise.all([chaxunlist,gettotal]).then((result)=>{
			resultObj.resultData = result[0]  
			resultObj.total      = result[1][0].total
			res.send(resultObj)  
		}).catch((error)=>{
			console.log(2,result)
		})		
	}	
})

//社团端 获取个人 负责部门树 
router.get('/handlefuzerentree',function(req,res,next){
	var xuehao = req.query.studentxuehao
	var sqlstr = 'SELECT A2.name as shetuanname ,A1.name as bumenname,A1.id as sectionid  from ((select name ,partyid,id from sectioninfo where chairmanxuehao like \'%'+xuehao+'%\') as A1 left join (SELECT name,id from shetuaninfo) as A2 on A1.partyid = A2.id)'

	db.query(sqlstr,[],function(results,fields){
		if(results.length != 0){
			var ResultsObj = {
				resultCode:1,
				resultMsg:'查询成功',
				resultData:results
			};			
		}else{
			var ResultsObj = {
				resultCode:0,
				resultMsg:'无匹配人员',
			};			
		}		
		res.send(ResultsObj)		
	})
})


//社团端 处理学生初审 
router.post('/handlechushenbiaodan',function(req,res,next){
	var id 	    	  = req.body.id
	var shifoutongguo = req.body.shifoutongguo 
	var shuoming      = req.body.shuoming
	var caozuozren    = req.body.realname
	var caozuorenid   = req.body.userid
	if(shifoutongguo  == 1 ){
		//原此处查询学生学号 先查询操作人学号
		//var selectfuzerensql = ' select h2.xuehao,h2.realname from((select applystudentid from join_party_info where id = ?) as h1 left join (SELECT id,xuehao,realname from userinfo) as h2 on h1.applystudentid = h2.id )'
		var selectfuzerensql = ' select xuehao from userinfo where id = ?'
		let selectfuzeren    = new Promise(function(resolve,reject){
			//原此处查询学生学号 先查询操作人学号 原为id 现为caozuorenid
			db.query(selectfuzerensql,[caozuorenid],function(results,fields){
				if(results.length != 0){
					resolve(results)
				}else{
					reject(fields)
				}					
			})
		})
		Promise.all([selectfuzeren]).then((result)=>{
			var party_infosql  = 'update  join_party_info set status = 3 where id = ?;'
			//原语句 需学生审核
			//var shetuanflowsql = 'update  shetuan_flow set nextCheckPersonXuehao = ? ,nextCheckPersonName = ?;'
			//先语句 不需要审核
			var shetuanflowsql = 'update  shetuan_flow set nextCheckPersonXuehao = ? WHERE mid = ?;'
			var shetuanlogsql  = 'INSERT INTO shetuan_log set optTime = now(),?;'
			var        allsql  = party_infosql+shetuanflowsql+shetuanlogsql 
			db.query(allsql,[id,result[0][0].xuehao,id,{optPersonName:caozuozren,optPersonId:caozuorenid,step:1,explain:shuoming,modulename:'joinparty',mid:id}],function(results1,fields){
				console.log(results1)
				if(results1.length != 0){
					var ResultsObj = {
						resultCode:1,
						resultMsg:'操作成功',
						resultData:null
					};
					res.send(ResultsObj)	
				}				
			})			
		}).catch(function(res){
			console.log(res)
		})
			


	}

})
//社团端 处理学生一面 
router.post('/handleyimianbiaodan',function(req,res,next){
	//此id为partyinfo id
	var id 	    	  = req.body.id
	var shifoutongguo = req.body.shifoutongguo 
	var shuoming      = req.body.shuoming
	var caozuozren    = req.body.realname
	var caozuorenid   = req.body.userid	
	if(shifoutongguo  == 1 ){
		//原此处查询学生学号 先查询操作人学号
		//var selectfuzerensql = ' select h2.xuehao,h2.realname from((select applystudentid from join_party_info where id = ?) as h1 left join (SELECT id,xuehao,realname from userinfo) as h2 on h1.applystudentid = h2.id )'
		var selectfuzerensql = ' select xuehao from userinfo where id = ?'
		let selectfuzeren    = new Promise(function(resolve,reject){
			//原此处查询学生学号 先查询操作人学号 原为id 现为caozuorenid
			db.query(selectfuzerensql,[caozuorenid],function(results,fields){
				if(results.length != 0){
					resolve(results)
				}else{
					reject(fields)
				}					
			})
		})
		Promise.all([selectfuzeren]).then((result)=>{
			var party_infosql  = 'update  join_party_info set status = 4 where id = ?;'
			//原语句 需学生审核
			//var shetuanflowsql = 'update  shetuan_flow set nextCheckPersonXuehao = ? ,nextCheckPersonName = ?;'
			//先语句 不需要审核
			var shetuanflowsql = 'update  shetuan_flow set nextCheckPersonXuehao = ? WHERE mid = ?;'
			var shetuanlogsql  = 'INSERT INTO shetuan_log set optTime = now(),?;'
			var        allsql  = party_infosql+shetuanflowsql+shetuanlogsql 
			db.query(allsql,[id,result[0][0].xuehao,id,{optPersonName:caozuozren,optPersonId:caozuorenid,step:2,explain:shuoming,modulename:'joinparty',mid:id}],function(results1,fields){
				console.log(results1)
				if(results1.length != 0){
					var ResultsObj = {
						resultCode:1,
						resultMsg:'操作成功',
						resultData:null
					};
					res.send(ResultsObj)	
				}				
			})			
		}).catch(function(res){
			console.log(res)
		})
			


	}	
})
module.exports = router;
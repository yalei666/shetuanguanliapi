var mysql    = require('mysql')
var dbConfig = require('./db.config')

module.exports = {
	query:(sql,params,callback)=>{
		var connection = mysql.createConnection(dbConfig)
		connection.connect(function(err){
			if(err){
				throw err
			}
			connection.query(sql,params,function(err,results,fields){
				if(err){
					throw err
				}
				callback && callback(JSON.stringify(results),JSON.stringify(fields))
				connection.end(function(err){
					if(err){
						throw err
					}
				})
			})
		})
	},
	
} 
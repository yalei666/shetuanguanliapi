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
				callback && callback(results,fields)
				connection.end(function(err){
					if(err){
						throw err
					}
				})
			})
		})
	},
	update:(sql,params,callback)=>{
		var connection = mysql.createConnection(dbConfig)
		connection.config.queryFormat = function (query, values) {
		  if (!values) return query;
		  return query.replace(/\:(\w+)/g, function (txt, key) {
		    if (values.hasOwnProperty(key)) {
		      return this.escape(values[key]);
		    }
		    return txt;
		  }.bind(this));
		};		
		connection.connect(function(err){
			if(err){
				throw err
			}
			connection.query(sql,params,function(err,results,fields){
				if(err){
					throw err
				}
				callback && callback(results,fields)
				connection.end(function(err){
					if(err){
						throw err
					}
				})
			})
		})
	},		
} 
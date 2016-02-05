/*jshint -W003, -W097, -W117, -W026 */
"use strict";

var mysql = require('mysql');
var squel = require ('squel');
var _ = require('underscore');
var settings = settings = require('./conf/settings.js');

var errorHandler = function(errorType,error){
    var currentdate = new Date(); 
    var datetime = currentdate.getDate() + "/"
                   + (currentdate.getMonth()+1)  + "/" 
                   + currentdate.getFullYear() + " @ "  
                   + currentdate.getHours() + ":"  
                   + currentdate.getMinutes() + ":" 
                   + currentdate.getSeconds();            
    var errorDescription= errorType + ' occurred at ' + datetime;
    console.log(errorDescription,error);
    
    };
    
var test = true;
// if (test) {
// 	settings = {
// 	    mysqlPoolSettings: {
// 	        connectionLimit : 10,
// 	        host: 'mocktest',
// 	        port: '0000',
// 	        user: 'mockuser',
// 	        password: 'mockpassword'
// 	    }
// 	}
// } else {
// 	settings = require('./conf/settings.js');
// }

module.exports = function() {
	var service = {};
	var pool  = mysql.createPool(settings.mysqlPoolSettings);


	var getServerConnection = function(connectHandler) {
		pool.getConnection(function(err, connection) {
			if (err) {
				errorHandler('exports:Database connection error',err);
            	return connectHandler(err, null);
			}
			return connectHandler(null, connection);
		});
	};

	//order=columname|asc,columnName|desc
var getSortOrder = function(param) {
    if(!param) return null;
    var parts;
    var order = [];
    _.each(param.split(','),function(order_by) {
        parts = order_by.split('|');
        order.push({column:parts[0],asc:(parts[1].toLowerCase() === "asc")});
    });
    return order;
};

var getFilters = function(filters) {
    var s="";
    var vals = [],column;
     _.each(filters,function(item) {
         column = item.column;
         for(var f in item.filters) {
             if(item.filters[f] === undefined || item.filters[f] === null || item.filters[f] === "") continue;
             console.log(item.filters[f]);
             s += column;
             if(f === "start") s += " >= ?";
             else if(f === "end") s += " <= ?";
             else s+= " like ?";
             vals.push(item.filters[f]);
             s += " AND ";
         }
     });
    s = s.substring(0, s.length-5);
    if(s !== "")
        s = "(" + s + ")";
    console.log(s);
    console.log(vals);
    return {s:s,vals:vals};
};
    var queryLimit = 300;
    var queryOffset = 0;

	service.queryServer = function(queryParts, callback) {
        var result = {};
		var sql = queryParts.sql;
		var values = queryParts.values;
        
        console.log('Sql query', sql);
		getServerConnection(function(err, connection) {
            if (err) {
                 errorHandler('queryServer: Database connection error',err);
                 return ;
            }

			connection.query(sql, values, function(err, rows, fields) {
                if(err) {
                    errorHandler('queryServer: Error querying server',err);
                    result.errorMessage = "Error querying server";
                    result.error = err;
                }
                else {
                    result.startIndex = queryOffset;
                    result.size = rows.length;
                    result.result = rows;
                }
                callback(result);
                connection.release();
			});
		});
	};



	service.queryServer_test = function(queryParts, callback) {
    var result = {};
    var tableAlias='t1';
        if(queryParts['alias'])tableAlias=queryParts['alias'];
    var s = squel.select()
        .from(queryParts['table'],tableAlias);

    _.each(queryParts['joins'],function(join) {
        s.join(join[0],join[1],join[2]);
    });

    _.each(queryParts['outerJoins'],function(join) {
        s.outer_join(join[0],join[1],join[2]);
    });

    _.each(queryParts['leftOuterJoins'],function(join) {
        s.left_outer_join(join[0],join[1],join[2]);
    });


    if (queryParts.columns && queryParts.columns !== "*" ) {
        if(typeof queryParts.columns === "string") {
            // if (queryParts.columns.substring(0, 1) === "(")
            //     queryParts.columns = queryParts.columns.substring(1, -1);
            queryParts.columns = queryParts.columns.split(',');
        }
        var i = 0;
        _.each(queryParts.columns, function (columnName) {
            if (i === 0 && columnName.substring(0,1) === "(")
                s.field(columnName.split("(")[1]);
            else if (i === queryParts.columns.length-1)
            {
                var col = columnName;
                var n = columnName.split(")").length-1;
                if(n === 1 && !_.contains(col,"("))
                    s.field(columnName.split(")")[0]);
                else s.field(col);
            }
            else s.field(columnName);
            i++;
        });
    }
    if (queryParts.concatColumns && queryParts.concatColumns !== "*" ) {
        if(typeof queryParts.concatColumns === "string") {
            // if (queryParts.columns.substring(0, 1) === "(")
            //     queryParts.columns = queryParts.columns.substring(1, -1);
            queryParts.concatColumns = queryParts.concatColumns.split(';');
        }
        var i = 0;
        _.each(queryParts.concatColumns, function (columnName) {
            if (i === 0 && columnName.substring(0,1) === "(")
                s.field(columnName.split("(")[1]);
            else if (i === queryParts.concatColumns.length-1)
            {
                var col = columnName;
                var n = columnName.split(")").length-1;
                if(n === 1 && !_.contains(col,"("))
                    s.field(columnName.split(")")[0]);
                else s.field(col);
            }
            else s.field(columnName);
            i++;
        });
    }


    s.where.apply(this,queryParts['where']);
    _.each(queryParts['order'], function(param) {s.order(param.column, param.asc);});
    s.limit(queryParts['limit'] || queryLimit);
    s.offset(queryParts['offset'] || queryOffset);
    _.each(queryParts['group'],function(col) {s.group(col);});


    var q = s.toParam();

    console.log(q.text.replace("\\",""));
    console.log(q.values);

    var sql = q.text.replace("\\","");
	var values = q.values;


    getServerConnection(function(err, connection) {
           if (err) {
                 errorHandler('queryServer_test: Database connection error', err);
                 return ;
            }
			connection.query(sql, values, function(err, rows, fields) {
				if(err) {
                    errorHandler('queryServer_test:Error querying server',err);
                    result.errorMessage = "Error querying server";
                    result.error = err;
                    result.sql=sql;
                    result.sqlParams=values;
                }
                else {
                    result.startIndex = queryParts.offset || queryOffset;
                    result.size = rows.length;
                    result.result = rows;
                    result.sql=sql;
                    result.sqlParams=values;
                }
				callback(result);
				connection.release();
			});
		});
};
  service.ExecuteMultiReport = function(sql,values, callback) {
    var result = {};
        var tableAlias='t1';
        getServerConnection(function(err, connection) {
            if (err) {
                 errorHandler('ExecuteMultiReport: Database connection error', err);
                 return ;
            }

            connection.query(sql, values, function(err, rows, fields) {
                if(err) {
                    errorHandler('ExecuteMultiReport: Error querying server',err);
                    result.errorMessage = "Error querying server";
                    result.error = err;
                    result.sql=sql;
                    result.sqlParams=values;
                }
                else {
                   // result.startIndex = queryParts.offset || queryOffset;
                    result.size = rows.length;
                    result.result = rows;
                    result.sql=sql;
                    result.sqlParams=values;
                }
                callback(result);
                connection.release();
            });
        });

    };
    service.reportQueryServer = function(queryParts, callback) {
    console.log(queryParts,"current query part")
        var result = {};
        var tableAlias='t1';
        if(queryParts['alias'])tableAlias=queryParts['alias'];
        var s = squel.select()
            .from(queryParts['table'],tableAlias);

        _.each(queryParts['joins'],function(join) {
            if (join[3]=='JOIN') s.join(join[0],join[1],join[2]);
            if (join[3]=='INNER JOIN') s.join(join[0],join[1],join[2]);
            if (join[3]=='OUTER JOIN') s.outer_join(join[0],join[1],join[2]);
            if (join[3]=='LEFT OUTER JOIN') s.left_outer_join(join[0],join[1],join[2]);
        });


        if (queryParts.columns && queryParts.columns !== "*" ) {
            if(typeof queryParts.columns === "string") {
                // if (queryParts.columns.substring(0, 1) === "(")
                //     queryParts.columns = queryParts.columns.substring(1, -1);
                queryParts.columns = queryParts.columns.split(',');
            }
            var i = 0;
            _.each(queryParts.columns, function (columnName) {
                if (i === 0 && columnName.substring(0,1) === "(")
                    s.field(columnName.split("(")[1]);
                else if (i === queryParts.columns.length-1)
                {
                    var col = columnName;
                    var n = columnName.split(")").length-1;
                    if(n === 1 && !_.contains(col,"("))
                        s.field(columnName.split(")")[0]);
                    else s.field(col);
                }
                else s.field(columnName);
                i++;
            });
        }
        if (queryParts.concatColumns && queryParts.concatColumns !== "*" ) {
            if(typeof queryParts.concatColumns === "string") {
                // if (queryParts.columns.substring(0, 1) === "(")
                //     queryParts.columns = queryParts.columns.substring(1, -1);
                queryParts.concatColumns = queryParts.concatColumns.split(';');
            }
            var i = 0;
            _.each(queryParts.concatColumns, function (columnName) {
                if (i === 0 && columnName.substring(0,1) === "(")
                    s.field(columnName.split("(")[1]);
                else if (i === queryParts.concatColumns.length-1)
                {
                    var col = columnName;
                    var n = columnName.split(")").length-1;
                    if(n === 1 && !_.contains(col,"("))
                        s.field(columnName.split(")")[0]);
                    else s.field(col);
                }
                else s.field(columnName);
                i++;
            });
        }


        s.where.apply(this,queryParts['where']);
        _.each(queryParts['order'], function(param) {s.order(param.column, param.asc);});
        s.limit(queryParts['limit'] || queryLimit);
        s.offset(queryParts['offset'] || queryOffset);
        _.each(queryParts['group'],function(col) {s.group(col);});


        var q = s.toParam();

        console.log(q.text.replace("\\",""));
        console.log(q.values);

        var sql = q.text.replace("\\","");
        var values = q.values;


        getServerConnection(function(err, connection) {
            if(err) {
                    errorHandler('reportQueryServer:Database connection error',err);
                    return;
            }
            connection.query(sql, values, function(err, rows, fields) {
                if(err) {
                    errorHandler('reportQueryServer: Error querying server',err);
                    result.errorMessage = "Error querying server";
                    result.error = err;
                    result.sql=sql;
                    result.sqlParams=values;
                }
                else {
                    result.startIndex = queryParts.offset || queryOffset;
                    result.size = rows.length;
                    result.result = rows;
                    result.sql=sql;
                    result.sqlParams=values;
                }
                callback(result);
                connection.release();
            });
        });

    };
function cretateQuery(queryParts,sq){
	var result = {};
	var  multiquery="";
	var multuvalues=[];
	var tableAlias='t1';
	if(queryParts['alias'])tableAlias=queryParts['alias'];
	var s
if(sq){
	s = squel.select()
			.from(sq,tableAlias);

}else {
	s = squel.select()
			.from(queryParts.table,tableAlias);
}
	_.each(queryParts['joins'],function(join) {
			if (join[3]=='JOIN') s.join(join[0],join[1],join[2]);
			if (join[3]=='INNER JOIN') s.join(join[0],join[1],join[2]);
			if (join[3]=='OUTER JOIN') s.outer_join(join[0],join[1],join[2]);
			if (join[3]=='LEFT OUTER JOIN') s.left_outer_join(join[0],join[1],join[2]);
	});


	if (queryParts.columns && queryParts.columns !== "*" ) {
			if(typeof queryParts.columns === "string") {
					// if (queryParts.columns.substring(0, 1) === "(")
					//     queryParts.columns = queryParts.columns.substring(1, -1);
					queryParts.columns = queryParts.columns.split(',');
			}
			var i = 0;
			_.each(queryParts.columns, function (columnName) {
					if (i === 0 && columnName.substring(0,1) === "(")
							s.field(columnName.split("(")[1]);
					else if (i === queryParts.columns.length-1)
					{
							var col = columnName;
							var n = columnName.split(")").length-1;
							if(n === 1 && !_.contains(col,"("))
									s.field(columnName.split(")")[0]);
							else s.field(col);
					}
					else s.field(columnName);
					i++;
			});
	}
	if (queryParts.concatColumns && queryParts.concatColumns !== "*" ) {
			if(typeof queryParts.concatColumns === "string") {
					// if (queryParts.columns.substring(0, 1) === "(")
					//     queryParts.columns = queryParts.columns.substring(1, -1);
					queryParts.concatColumns = queryParts.concatColumns.split(';');
			}
			var i = 0;
			_.each(queryParts.concatColumns, function (columnName) {
					if (i === 0 && columnName.substring(0,1) === "(")
							s.field(columnName.split("(")[1]);
					else if (i === queryParts.concatColumns.length-1)
					{
							var col = columnName;
							var n = columnName.split(")").length-1;
							if(n === 1 && !_.contains(col,"("))
									s.field(columnName.split(")")[0]);
							else s.field(col);
					}
					else s.field(columnName);
					i++;
			});
	}


	s.where.apply(this,queryParts['where']);
	_.each(queryParts['order'], function(param) {s.order(param.column, param.asc);});
	s.limit(queryParts['limit'] || queryLimit);
	s.offset(queryParts['offset'] || queryOffset);
	_.each(queryParts['group'],function(col) {s.group(col);});

return s;
} 
    service.reportMultiQueryServer = function(queryPartsArray) {
    var  multiquery="";
    var multuvalues=[];
     var result = {};
     var tableAlias='t1';
    _.each(queryPartsArray,function(queryParts){
       if(queryParts!==undefined)
       {
				 var s;
				 if (queryParts.nestedParts!==undefined && queryParts.nestedParts.length>0){
					s=cretateQuery(queryParts,	cretateQuery(queryParts.nestedParts[0]));
				}else {
					s=cretateQuery(queryParts);
				}
				var q = s.toParam();

				console.log(q.text.replace("\\",""));
				console.log(q.values,"Values  passed");
				var sql = q.text.replace("\\","");
				var values = q.values;
				if( multiquery===""){
				multiquery=sql;}else{
			multiquery= multiquery+";"+sql;
			}
			_.each(values,function(res){
			multuvalues.push(res);
			});
      }
    });
    return [ multiquery,multuvalues];
    };


	return service;
}();

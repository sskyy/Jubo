define([], function() {
    var exports = {},
        tokenAddr = "http://127.0.0.1:1337/csrfToken",
        token


    exports.patch = (function(){
        var patched = false
        return function(){

            //patch for underscore
            _.minMulti = function( arr, iterator ){
                var temp = []
                _.each( arr, function( item ){
                    var iterRes = iterator(item)
                    if( temp[0] && iterRes < temp[0][0] ){
                        temp = [] 
                    }
                    if( temp.length == 0 || iterRes == temp[0][0] ){
                        temp.push( [iterRes,item] )
                    }
                })

                return temp.map(function(item){
                    return item[1]
                })
            }


            patched = true
        }
    })()
    

    exports.getCsrfToken = function(){
        var q = $.Deferred()
        if( token ){
            q.resolve( token )
        }else{
            $.ajax({
                url:tokenAddr,
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                }
            }).fail(function(tokenRes){

                q.reject(tokenRes)

            }).done(function(tokenRes){
                token = tokenRes._csrf
                q.resolve( token )
            })
        }
        return q
    }



    exports.api = (function(){


        return function( opt ){
            var defer = $.Deferred()

            function wrapOpt( opt ){
                if( !opt.type || /post/i.test(!opt.type)){
                    return opt
                }
                opt.headers = _.extend({
                    "X-CSRF-Token":token
                },opt.headers||{})
                return _.extend(opt,{
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    }
                })
            }

            if( token ){
                opt= wrapOpt(opt)
                //TODO 增加token过期处理
                defer = $.ajax( opt)
            }else{
                $.ajax({
                    url:tokenAddr,
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    }
                }).fail(function(tokenRes){

                    defer.reject(tokenRes)

                }).done(function(tokenRes){
                    token = tokenRes._csrf
                    opt= wrapOpt(opt)

                    console.log("AJX:",opt)
                    $.ajax( opt).done(function( res ){
                        defer.resolve( res )
                    }).fail(function(res){
                        defer.reject( res )
                    })
                })

            }
            return defer
        }
    })()

    return exports

})


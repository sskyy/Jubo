define([], function() {
    var exports = {},
        tokenAddr = "http://127.0.0.1:1337/csrfToken"

    exports.api = (function(){
        var token


        return function( opt ){
            var defer = $.Deferred()

            function wrapOpt( opt ){
                if( !opt.type || /post/i.test(!opt.type)){
                    return opt
                }
                opt.data = _.extend({
                    "_csrf":token
                },opt.data||{})
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


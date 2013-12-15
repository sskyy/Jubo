define(['./util'], function(util) {
    var exports = {},
        baseUrl = "http://127.0.0.1:1337/"
        connectAddr = baseUrl + "user/connect",
        loginAddr = baseUrl + "user/login",
        logoutAddr = baseUrl + "user/logout",
        tokenAddr = baseUrl + "user/token"


    exports.vmodel = (function(){
        var loginVm,token

        return function(general){
            if( !loginVm ){

                loginVm = avalon.define("login",function(vm){
                    vm.inputUsername = ""
                    vm.inputPassword = ""
                    vm.message = ""
                    vm.login = function(){
                        return $.ajax(loginAddr,{
                            type:"POST",
                            cache:false,
                            dataType:"json",
                            data:'username=' + encodeURIComponent(vm.inputUsername) + '&password=' + encodeURIComponent(vm.inputPassword),
                        }).done( function(data){
                            _.extend(general.user , data.user)
                            $.cookie(data.session_name,data.sessid)
                            vm.message=""
                            general.changeModal()
                            console.log("SUS: Login success",data.user.name)
                        }).fail(function( res,status, msg ){
                            console.log( "SUS: Login failed")
                            if( res.status == 401){
                                vm.message = "用户名或密码错误"
                            }else{
                                vm.message = "服务器错误"
                            }
                        })
                    }
                    vm.keypress = function($e){
                        if( $e.which == 13){
                            vm.login()
                        }
                    }
                    vm.logout = function(){
                        return util.api({
                            url:logoutAddr,
                            type:"POST",
                            dataType: 'json'
                        }).done( function(data){
                            general.user.reset()
                            console.log("SUS: Bye!")
                        }).fail(function(){
                            console.log("ERR: 退出失败")
                        })
                    }
                    vm.whoami = function(){
                        return util.api({
                            type:"POST",
                            url : connectAddr,
                            dataType:'json',
                        })
                    }
                })   

                // init user
                console.log("DEB: checking current user")
                loginVm.whoami().done(function( user ){
                    if( user.id != 0){
                        _.extend(general.user , user)
                        console.log("DEB: Hello ", user.name)
                    }else{
                        console.log("DEB: current user not login")
                    }
                }).fail(function(data){
                    console.log("ERR: whoami failed", data)
                })
            }

            return loginVm
        }
    })()

    return exports

})
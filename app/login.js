define(['./util'], function(util) {
    var exports = {},
        baseUrl = "http://127.0.0.1:8080/drupal/"
        connectAddr = baseUrl + "api/system/connect.json",
        loginAddr = baseUrl + "api/user/login.json",
        logoutAddr = baseUrl + "api/user/logout.json",
        tokenAddr = baseUrl + "api/user/token.json"


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
                loginVm.whoami().done(function( data ){
                    if( data.user.uid != 0){
                        _.extend(general.user , data.user)
                        console.log("DEB: Hello ", data.user.name)
                    }else{
                        console.log("DEB: current user not login")
                    }
                }).fail(function(data){
                    console.log("ERR: whoami failed", data)
                })
                // loginVm.inputUsername = "root"
                // loginVm.inputPassword = "rootroot1"
                // loginVm.login().done(function(){
                //     // loginVm.whoami().done(function(){
                //     //     loginVm.logout()
                //     // })
                // })
            }

            return loginVm
        }
    })()

    return exports

})
define(['./util','./global'], function(Util,Global) {
    var exports = {},
        baseUrl = Global.baseUrl,
        connectAddr = baseUrl + "user/connect",
        loginAddr = baseUrl + "user/login",
        regAddr = baseUrl + "user/register",
        logoutAddr = baseUrl + "user/logout",
        tokenAddr = baseUrl + "csrfToken"


    exports.vmodel = (function(){
        var loginVm,token

        return function(general){
            if( !loginVm ){

                loginVm = avalon.define("login",function(vm){
                    vm.name = ""
                    vm.password = ""
                    vm.message = ""
                    vm.regMode = false
                    vm.regName = ""
                    vm.regPassword = ""
                    vm.regEmail = ""
                    vm.regMessage = ""
                    vm.connecting = false
                    vm.login = function(){
                        vm.connecting = true

                        return Util.api({
                            url : loginAddr,
                            type:"POST",
                            dataType:"json",
                            data:{
                                name:vm.name,
                                password:vm.password
                            }
                        },true).done( function( user ){
                            vm.connecting = true
                            _.extend(general.user , user)
                            // $.cookie(data.session_name,data.sessid)
                            vm.message=""
                            general.changeModal()
                            console.log("SUS: Login success",user.name)
                        }).fail(function( res,status, msg ){
                            console.log( "SUS: Login failed")
                            vm.connecting = true
                            if( res.status == 404){
                                vm.message = "用户名或密码错误"
                            }else{
                                vm.message = "服务器错误"
                            }
                        })
                    }
                    vm.keypress = function($e){
                        if( $e.which == 13){
                            if( !vm.regMode){
                                vm.login()
                            }else{
                                vm.register()
                            }
                        }
                    }
                    vm.register = function(){
                        vm.connecting = true
                        return Util.api({
                            url:regAddr,
                            type:"POST",
                            data:{
                                name :vm.regName,
                                password : vm.regPassword,
                                email : vm.regEmail
                            }
                        }).done( function(){
                            general.changeModal()
                            vm.whoami()
                            console.log("SUS: register success",user)
                        }).fail(function(){
                            vm.connecting = true
                            vm.regMessage = "注册失败"
                            console.log("ERR: register failed")
                        })
                    }
                    vm.logout = function(){
                        return Util.api({
                            url:logoutAddr,
                            type:"POST"
                        }).done( function(data){
                            general.user.reset()
                            console.log("SUS: Bye!")
                        }).fail(function(){
                            console.log("ERR: 退出失败")
                        })
                    }
                    vm.whoami = function(){
                        return Util.api({
                            type:"POST",
                            url : connectAddr,
                            dataType:'json',
                        })
                    }
                    vm.changeRegMode = function( regMode ){
                        vm.regMode = regMode || false
                        console.log( "regMode",regMode )
                    }
                })   

                // init user


                //test for register
                // loginVm.regName = "root"
                // loginVm.regPassword = "rootroot"
                // loginVm.regEmail = "root@root.com"
                // loginVm.register()

                //test for login
                // loginVm.name = "root"
                // loginVm.password = "rootroot"
                // loginVm.login().done(function(){
                //     loginVm.whoami().done(function( user ){
                //         if( user.id != 0){
                //             _.extend(general.user , user)
                //             console.log("DEB: Hello ", user.name)
                //         }else{
                //             console.log("DEB: current user not login")
                //         }
                //     }).fail(function(data){
                //         console.log("ERR: whoami failed", data)
                //     })
                // })
                
                //test for logout
                // loginVm.logout().done(function(){
                //     loginVm.whoami().done(function( user ){
                //         if( user.id != 0){
                //             _.extend(general.user , user)
                //             console.log("DEB: Hello ", user.name)
                //         }else{
                //             console.log("DEB: current user not login")
                //         }
                //     }).fail(function(data){
                //         console.log("ERR: whoami failed", data)
                //     })
                // })

            }

            return loginVm
        }
    })()

    return exports

})
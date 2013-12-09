define(['./event','./create','./login','./list'], function( Event, Create,Login,List ) {
    var exports = {}

    var generalVm = avalon.define('general',function(vm){
        vm.viewMode = "view"
        vm.user = {
            uid:0,
            name:"",
            reset : function( user){
                console.log("DEB: reset user")
                if( !user){
                    generalVm.user.uid=0
                    generalVm.user.name=""
                }
                console.log("DEB: reset user")
            }
        }

        vm.logout = function(){
            loginVm.logout()
        }
        vm.changeView = function( mode ){
            mode = mode || 'all'
            vm.viewMode = mode
        }
    })


    //需要跟全局通信的数据都放在generalVm里面
    var eventVm = Event.vmodel(),
        createVm = Create.newParamVm(),
        createEvent = Create.newEventVm(),
        loginVm = Login.vmodel( generalVm ),
        listVm  = List.vmodel()

    exports.run = function(){
        
        avalon.scan()

        page("/event/list",function(){
            generalVm.changeView("all")
            listVm.get()
        })

        page("/event/:eid",function( ctx, next ){
            console.log( "route to event", ctx.params.eid)
            eventVm.showEvent( ctx.params.eid )
            generalVm.changeView("event")
        })

        page("/create/param",function(){
            generalVm.changeView("newParam")
        })

        page("/create/event",function(){
            generalVm.changeView("newEvent")
        })

        page("/event/:eid/param/:pid",function( ctx,next){
            console.log("route to param", ctx.params.eid, ctx.params.pid)
            generalVm.changeView("event")
            eventVm.showParam( ctx.params.eid, ctx.params.pid )
        })


        page("*",function(){
            console.log("ERR: SOMETHING WRONG WITH ROUTER!!! * TAKE CHARGE NOW!!!")
        })

        page()
        // console.log( window.location)

        page(window.location.search.replace("?q=",""))


    } 


    return exports

})
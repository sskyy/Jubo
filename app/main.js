define(['./param','./event','./create'], function( Param, Event, Create ) {
    var exports = {},
        eventVm = Event.vmodel(),
        detailParam = Param.vmodel(),
        createVm = Create.vmodel()

    var generalVm = avalon.define('general',function(vm){
        vm.viewMode = "view"
        vm.changeView = function( mode ){
            vm.viewMode = mode
        }
    })
    

    exports.run = function(){
        
        avalon.scan()

        page("/event/:eid",function( ctx, next ){
            console.log( "route to event", ctx.params.eid)
            eventVm.showEvent( ctx.params.eid )
        })

        page("/create/param",function(){
            generalVm.changeView("newParam")
        })

        page("/create/event",function(){
            generalVm.changeView("newEvent")
        })

        page("/event/:eid/param/:pid",function( ctx,next){
            console.log("route to param", ctx.params.eid, ctx.params.pid)
            eventVm.showParam( ctx.params.eid, ctx.params.pid )
        })


        page("*",function(){
            console.log("don't go, route *")
        })

        page()
        // console.log( window.location)

        page(window.location.search.replace("?q=",""))


    } 


    return exports

})
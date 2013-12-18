define(['./event','./create','./login','./list','./util'], function( Event, Create,Login,List,util ) {
    moment.lang('zh-cn')
    util.patch()

    var exports = {}

    var generalVm = avalon.define('general',function(vm){
        vm.viewMode = "view"
        vm.modalMode = ""
        vm.landing = true
        vm.user = {
            id:0,
            name:"",
            reset : function( user){
                console.log("DEB: reset user")
                if( !user){
                    generalVm.user.id=0
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
        vm.changeModal = function( mode){
            mode = mode || ""
            vm.modalMode =  mode
        }
        vm.getEventId = function(){
            return eventVm.id
        }
        vm.getPieceId = function(){
            return eventVm.getPieceId()
        }
    })


    //需要跟全局通信的数据都放在generalVm里面
    var eventVm = Event.vmodel( generalVm ),
        createVm = Create.newPieceVm(generalVm),
        createEvent = Create.newEventVm(),
        loginVm = Login.vmodel( generalVm ),
        listVm  = List.vmodel()



    exports.run = function(){
        
        avalon.scan()
        //页面元素的显示状态都由全局的viewMode控制。login之类的弹窗由modalMode控制。
        //页面的改变都由路径控制。
        page("/event/list",function(){
            generalVm.changeView("all")
            listVm.get().done(function(){
                generalVm.landing = false
            })
        })

        page("/event/:eid",function( ctx, next ){
            // console.log( "route to event", ctx.params.eid)
            var qs = parseQueryString(ctx.querystring)
            eventVm.showEvent( ctx.params.eid, qs.refresh || false )
            generalVm.changeView("event")
        })

        page("/create/piece",function(){
            if( !eventVm.id ){
                eventVm.loadMyEvents()
            }
            generalVm.changeView("newPiece")
        })

        page("/create/event",function(ctx){
            generalVm.changeView("newEvent")
        })

        page("/event/:eid/piece/:pid",function( ctx,next){
            // console.log("route to piece", ctx.params.eid, ctx.params.pid)
            generalVm.changeView("piece")
            eventVm.showPiece( ctx.params.eid, ctx.params.pid )
        })

        page("*",function(){
            console.log("ERR: SOMETHING WRONG WITH ROUTER!!! * TAKE CHARGE NOW!!!")
            page("/event/list")
        })

        page()
        // console.log( window.location)

        page(window.location.search.replace("?q=",""))


    } 


    return exports

    function parseQueryString( qs ){
        return _.object( qs.split("&").map(function(s){
            return s.split("=")
        }))
    }


})
define(['./diagram'], function( Diagram ) {
    var exports = {};

    function standardParams( params ){
        var oneDay = 24*60*60*1000
        for( var i=0,length=params.length;i<length;i++){
            if( i > 0 ){
                params[i].fromLast = Math.ceil((params[i].time-params[i-1].time)/oneDay).toString()+'天'
            }
            params[i].timeText = moment(params[i].time).format('YYYY-MM-DD')

            params[i].isActive = false
        }
        return params
    }

    var eventVm = avalon.define("event",function(vm){
        vm.params = []
        vm.title = null
        vm.intro = null
        vm.currentMetric = null
        vm.currentParam = null
        vm.detailParam = null

        vm.active = function(){
            for( var i=0,length=eventVm.params.length;i<length;i++){
                if( eventVm.params[i].id == this.$vmodel.param.id ){
                    eventVm.currentParam = {
                        index: i,
                        param : eventVm.params[i].$model
                    }
                }
            }
        }
        vm.unactive = function(){
            eventVm.currentParam= null
        }
        vm.setDetailParam = function(){
            vm.currentParam = vm.params[0]
        }
        vm.clearDetailParam = function(){
            vm.currentParam = null
        }

        vm.set = function( event ){
            event.params = standardParams( event )
            _.extend( vm, event )
        }
    })
    avalon.scan()

    exports.run = function(){
        function loadEventQ( eid ){
            return $.getJSON("./data/event.json")
        }

        function loadSegmentQ( pid ){
            return $.getJSON("./data/detailParam.json")
        
        }

        page("/event/:eid",function( ctx, next ){
            Diagram.preRender()
            loadEventQ( ctx.params.eid ).done( function(res){
                eventVm.set( res ) 
                Diagram.render( eventVm )
            })
            next()
        })

        page("/event/:eid/param/:pid",function( ctx){
            loadSegmentQ( ctx.params.pid ).done( function( res ){
                eventVm.detailParam = res
            })
        })

        page("*",function(){
            console.log("don't go")
        })

        page()

        page('/event/1')
    } 

    return exports

})
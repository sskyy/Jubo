define(['./diagram'], function(Diagram) {
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
    
    exports.vmodel = (function(){
        var eventVm
        return function(){
            if( !eventVm){
                eventVm = avalon.define("event",function(vm){
                    vm.params = []
                    vm.metrics = {}
                    vm.metricsKeys = []
                    vm.title = null
                    vm.intro = null
                    vm.currentMetric = null
                    vm.currentParam = null
                    vm.id = null
                    vm.view = "overview"
                    vm.$skipArray = ["metrics"]
                    vm.active = function(param){
                        vm.currentParam = param
                        console.log("active param", param)
                    }
                    vm.unactive = function(){
                        vm.currentParam= null
                    }
                    vm.loadEvent = function( id, refresh ){
                        if( refresh || !vm.id || id != vm.id ){
                            console.log("ajax get event data", refresh, vm.id, id!= vm.id)
                            $.getJSON("/data/event.json").done( function(res){
                                vm.set( res ) 
                            })    
                        }
                    }
                    vm.showEvent = function(id){
                        (vm.view != "overview") && (vm.view = "overview")
                        Diagram.preRender()
                        vm.loadEvent( id )
                    }
                    vm.loadParam = function( pid, refresh ){
                        $.getJSON("/data/detailParam.json").done( function( res ){
                            detailParam.set(res)
                        })
                    }
                    vm.showParam = function( eid, pid){
                        (vm.view != "detailParam") && (vm.view = "detailParam")
                        Diagram.preRender()
                        vm.loadEvent( eid )
                        vm.loadParam( pid )
                    }
                    vm.gotoView = function( view, refresh ){
                        if( refresh || vm.view != view ){
                            vm.view = view                    
                        }
                    }

                    vm.setMetric = function(){
                        vm.currentMetric = _.keys(vm.metrics)[0]
                    }

                    vm.set = function( event ){
                        vm.currentMetric = event.args.defaultMetric
                        vm.metricsKeys = _.keys( event.metrics)
                        event.params = standardParams( event.params )
                        _.extend( vm, event )
                    }
                    vm.paramRendered = function(a){
                        if( a == "add" && eventVm.params.length!==0){
                            Diagram.render( eventVm )
                        }
                    }
                    vm.getEventId = function(){
                        return vm.id
                    }
                })
                return eventVm
            }
        }
    })()

    return exports

})
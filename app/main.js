define(['./diagram','./param'], function( Diagram, Param ) {
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

    var vmodel = (function(){
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
                    vm.view = "overview"

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
                    vm.gotoDetailParam = function(){
                        vm.view = "detailParam"
                        page('/event/'+eventVm.id+'/param/'+this['data-param'].id)
                    }
                    vm.gotoOverview = function(){
                        vm.view = "overview"
                        page('/event/'+eventVm.id)
                        // console.log( eventVm)

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
                })
                return eventVm
            }
        }
    })()
    


    

    exports.run = function(){
        var eventVm = vmodel(),
            detailParam = Param.vmodel()
        
        avalon.scan()

        function loadEventQ( eid ){
            return $.getJSON("/data/event.json")
        }

        function loadSegmentQ( pid ){
            return $.getJSON("/data/detailParam.json")
        
        }

        page("/event/:eid",function( ctx, next ){
            Diagram.preRender()
            if( !eventVm.id ){
                loadEventQ( ctx.params.eid ).done( function(res){
                    eventVm.set( res ) 
                })    
            }
        })

        page("/event/:eid/param/:pid",function( ctx){
            loadSegmentQ( ctx.params.pid ).done( function( res ){
                detailParam.set(res)
            })
        })

        page("*",function(){
            // console.log("don't go")
        })

        page()
        page('/event/1')


    } 


    return exports

})
define(['./util'], function(util) {
    var exports = {},
        paramContentSelector="#newParamContent",
        paramMenuSelector = "#newParamMenu",
        previewSelector = "#newParamPreview",
        createNodeAddr = "http://127.0.0.1:8080/drupal/api/node.json",
        addRelationAddr = "http://127.0.0.1:8080/drupal/api/relation.json"


    exports.newParamVm = (function(){
        var createVm
        return function( general){
            if( !createVm ){
                //init pen
                var editor = document.querySelector(paramContentSelector),
                    pen = new Pen({
                        editor : editor,
                        menu : paramMenuSelector,
                        stay : false
                    })

                createVm = avalon.define("createParam",function(vm){
                    // vm.name="aaaa"
                    vm.newTitle = ""
                    vm._newMetric = {
                        name : "",
                        num : null
                    }
                    vm.newMetrics = {}
                    vm._metricKeys = []
                    vm.publish = function(){
                        $(previewSelector).html( editor.innerHTML )
                        if( !general.getEventId() ){
                            alert("请选择你要将此片段插入的事件")
                            return 
                        }
                        util.api({
                            url : createNodeAddr,
                            type:"POST",
                            data:{
                                type: "param",
                                title : vm.newTitle,
                                body : {
                                    und : [{
                                        value : editor.innerHTML,
                                        format:"filtered_html"
                                    }]
                                },
                                field_metric:{
                                    und:_.map(vm.newMetrics.$model,function(metricNum,metricName){
                                        return {value:metricName+":"+metricNum}
                                    })
                                }
                            }
                        }).done(function(res){
                            console.log("DEB: param add success",res)
                            vm.addRelation(res.nid, general.getEventId())
                        })
                    }
                    vm.addRelation = function( pid, eid){
                        console.log("DEB: adding relation", pid, eid)
                        return util.api({
                            url : addRelationAddr,
                            type : "POST",
                            data:{
                                "relation_type": "is_param_of",
                                "endpoints": {
                                    "und": [
                                        {
                                            "entity_type": "node",
                                            "entity_id": pid,
                                            "r_index": "0"
                                        },
                                        {
                                            "entity_type": "node",
                                            "entity_id": eid,
                                            "r_index": "1"
                                        }
                                    ]
                                }
                            }
                        }).done(function(){
                            console.log("SUS: add Relation for", pid, eid, "suscess")
                            page("/event/"+eid)
                        })
                    }
                    vm.keypressMetric = function( $e ){
                        if( e.which ==13){
                            vm.addMetric()
                        }
                    }
                    vm.addMetric = function(){
                        if( vm._newMetric.name !== "" 
                            && vm._newMetric.num !== null 
                            && vm.newMetrics[vm._newMetric.name] === undefined
                            ){
                            var placeholder = {}
                            placeholder[vm._newMetric.name] = vm._newMetric.num
                            vm.newMetrics = _.extend({},vm.newMetrics.$model,placeholder)
                            console.log('DEB: add metric', vm._newMetric.name,vm._newMetric.num,vm.newMetrics)
                        }else{
                            console.log(vm._newMetric.name !== "" ,vm._newMetric.num !== null ,vm.newMetrics[vm._newMetric.name] === undefined)
                        }
                        vm._newMetric.name = ""
                        vm._newMetric.num = null
                    }
                    vm.deleteMetric = function( metricName ){
                        if( vm.newMetrics[metricName] !== undefined){
                            vm.newMetrics = _.omit(vm.newMetrics.$model, metricName)
                        }
                    }

                })   
            }

            return createVm
        }
    })()

    exports.newEventVm = (function(){
        var createEvent
        return function(){
            if( !createEvent){
                createEvent = avalon.define("createEvent",function(vm){
                    vm.newEventTitle = ""
                    vm.newEventIntro = ""
                    vm.connecting = false
                    vm.publish= function(){
                        if( vm.connecting) return 
                        vm.connecting = true
                        util.api({
                            url:createNodeAddr,
                            type:"POST",
                            data:{
                                type:"event",
                                title:vm.newEventTitle,
                                body:{
                                    und:[{
                                        value:vm.newEventIntro
                                    }]
                                }
                            }
                        }).done(function(res){
                            vm.connecting = false
                            page('/event/'+res.nid)
                            console.log("SUS: create event suscess",res)
                        }).fail(function(res){
                            vm.connecting = false
                            console.log("ERR: create event failed",res)
                        })                      
                    }
                })
            }

            return createEvent
        }
    })()

    return exports

})
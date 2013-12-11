define(['./util'], function(util) {
    var exports = {},
        paramAddr = "http://127.0.0.1:8080/drupal/api/node/"
    var renderGallary = function( vmodel ){
        console.log("DEB: rendering gallery")
        $("#slider").responsiveSlides({
            auto: false,
            pager: false,
            nav: true,
            speed: 500,
            namespace : 'slider',
            // before : function( i ){
            //     vmodel.currentPic = i
            // },
            before : function( i){
                vmodel.currentPic = i
            }
        });
    }

    exports.vmodel = (function(){
        var detailParam
        return function(){
            if( !detailParam ){
                detailParam = avalon.define("detailParam",function(vm){
                    vm.id=null
                    vm.pics=[]
                    vm.currentPic=0
                    vm.content = ""
                    vm.title = ""
                    vm.author = {
                        name : "",
                        signature : ""
                    }
                    vm.metric = {}
                    vm.metricVal = {}
                    vm.eventMetrics = {}
                    vm.$skipArray = ['metricVal']
                    vm.set = function( param){
                        _.extend( detailParam, param)
                        // console.log( vm.currentPic, vm)
                    }
                    vm.load = function( id ){
                        return util.api({
                            url:paramAddr + id + '.json'
                        }).done(function(data){
                            console.log("DEB: load param", data)
                            vm.set({
                                id : data.nid,
                                title : data.title,
                                content : data.body.und[0].value,
                                metricVal : _.object(data.field_metric.und.map(function(m){
                                    m = m.value.split(":")
                                    m[1] = parseFloat(m[1])
                                    return m
                                }))
                            })
                        })
                    }
                    vm.setEventMetrics = function( eventMetrics ){
                        vm.eventMetrics = eventMetrics
                        //becaus avalon's {{}} won't listen eventMetric
                        //we set metrics here
                        var paramMetric = _.extend({},eventMetrics)
                        _.each(paramMetric,function(metric, key){
                            if( vm.metricVal[key] === undefined ){
                                metric.val =  metric.bottom
                            }else{
                                metric.val = vm.metricVal[key]
                            }
                        })
                        vm.metric = paramMetric
                        console.log("========seting metirc val", vm.metricVal)
                        console.log("DEB: event metrics",paramMetric)

                    }
                    vm.detailParamRendered = function(a){
                        if( a == "add" && detailParam.id){
                            renderGallary( detailParam )
                        }
                    }
                })
            }

            return detailParam
        }
    })()

    return exports

})
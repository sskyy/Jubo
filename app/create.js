define(['./util'], function(util) {
    var exports = {},
        paramContentSelector="#newParamContent",
        paramMenuSelector = "#newParamMenu",
        previewSelector = "#newParamPreview",
        createEventAddr = "http://127.0.0.1:8080/drupal/api/node.json"


    exports.newParamVm = (function(){
        var createVm
        return function(){
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
                    vm.publish = function(){
                        alert( vm.newTitle)
                        $(previewSelector).html( editor.innerHTML )
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
                            url:createEventAddr,
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
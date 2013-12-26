define(['./util','./global'], function(util,Global) {
    var exports = {},
        baseUrl = Global.baseUrl,
        listAddr= {
            'board' : baseUrl + "heat/board",
            'newest' : baseUrl + "event/newest",
        }
        rankingAddr = 
        myEventsAddr = baseUrl + "event/myEvents"

    exports.listVm = (function(){
        var allVm
        return function(){
            if( !allVm ){
                allVm = avalon.define("events",function(vm){
                    vm.events =[]
                    vm.get = function(type){
                        return util.api({
                            url:listAddr[type],
                        }).done(function(data){
                            vm.events = data
                        })
                    }
                })
            }

            return allVm
        }
    })()

    exports.myEventsVm = (function(){
        var myEventsVm
        return function( general){
            if( !myEventsVm ){
                myEventsVm = avalon.define("myEvents",function(vm){
                    vm.events =[]
                    vm.get = function(){
                        return general.getUser().done(function(){
                            return util.api({
                                url:myEventsAddr,
                            }).done(function(data){
                                vm.events = data
                            })
                        })

                    }
                })
            }

            return myEventsVm
        }
    })()

    return exports

})
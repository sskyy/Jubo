define(['./util','./global'], function(util,Global) {
    var exports = {},
        baseUrl = Global.baseUrl,
        rankingAddr = baseUrl + "event/ranking",
        myEventsAddr = baseUrl + "event/myEvents"

    exports.allVm = (function(){
        var allVm
        return function(){
            if( !allVm ){
                allVm = avalon.define("events",function(vm){
                    vm.events =[]
                    vm.get = function(){
                        return util.api({
                            url:rankingAddr,
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
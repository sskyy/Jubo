define(['./util','./global'], function(util,Global) {
    var exports = {},
        baseUrl = Global.baseUrl,
        listAddr = baseUrl + "event"

    exports.vmodel = (function(){
        var listVm
        return function(){
            if( !listVm ){
                listVm = avalon.define("events",function(vm){
                    vm.events =[]
                    vm.get = function(){
                        return util.api({
                            url:listAddr,
                        }).done(function(data){
                            vm.events = data
                        })
                    }
                })
            }

            return listVm
        }
    })()

    return exports

})
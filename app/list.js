define(['./util'], function(util) {
    var exports = {},
        listAddr = "http://127.0.0.1:8080/drupal/api/events.json?display_id=services_1"

    exports.vmodel = (function(){
        var listVm
        return function(){
            if( !listVm ){
                listVm = avalon.define("events",function(vm){
                    vm.events =[]
                    vm.get = function(){
                        util.api({
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
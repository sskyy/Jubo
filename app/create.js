define([], function() {
    var exports = {},
        paramContentSelector="#newParamContent",
        paramMenuSelector = "#newParamMenu",
        previewSelector = "#newParamPreview"


    exports.vmodel = (function(){
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
                        console.log( vm.newTitle)
                        $(previewSelector).html( editor.innerHTML )
                    }
                })   


            }

            return createVm
        }
    })()

    return exports

})
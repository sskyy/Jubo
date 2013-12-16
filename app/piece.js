define(['./util'], function(util) {
    var exports = {},
        pieceAddr = "http://127.0.0.1:1337/piece/pieceWithPics/",
        sliderPrevSelector = ".slideController.prev",
        sliderNextSelector = ".slideController.next",
        sliderContainerSelector = "#MpiecePics",
        piecePicSelector = ".piecePic"

    var resetGallary = (function(){
        var rendered = false,
            $slide,
            index = 0,
            rotate,
            visible = { "opacity": 1},
            hidden = {"opacity": 0},
            vmodel
 
        function slideTo( i ){
            if( i<0 || i> $slide.length-1){
                return console.log("ERR: slide out of boudary",i,$slide.length)
            }
            $slide.css(hidden)
                .eq(i)
                .css(visible);

            index = i
            vmodel.currentPic = index
        }

        //auto cycle
        function startCycle() {
            if( $slide.length > 1 && !rotate){
                console.log("startCycle")
                rotate = setInterval(function () {
                    if( !vmodel.loading ){
                        // Clear the event queue
                        $slide.stop(true, true);

                        index = index < $slide.length -1 ? index+1 : 0;
                        slideTo(index);
                    }else{
                        console.log( "vmodel.loading, we stop!!!!")
                    }
                }, 3000);
            }else{
                console.log("can't restart", $slide.length, rotate)
            }
        };

        function bindController(){
            $(sliderNextSelector).click(function(){
                if( index < $slide.length ){
                    slideTo( ++index )
                }
            })

            $(sliderPrevSelector).click(function(){
                if( index >0 ){
                    slideTo( --index )
                }
            })
        }

        function bindPause(){
            $(sliderContainerSelector).hover(function () {
                clearInterval(rotate);
                rotate = undefined
                console.log("hover clear",rotate)

            }, function (){
                console.log( "hover restart")
                startCycle();
            });
        }   

        function resetGlobal(vm){
            //reset global variables
            $slide = $(piecePicSelector)
            index = 0
            vmodel = vm
        }

        //must be called after pic dom rendered
        return function( vm ){
            resetGlobal(vm)

            if( rendered ){
                clearInterval(rotate)
                rotate = undefined
                console.log("second rendering")
                startCycle()
                return 
            }else{
                //add event listener
                bindController()
                startCycle()
                bindPause()
                //Pause on hover

                rendered=true
            }
        }
    })()

    exports.vmodel = (function(){
        var detailPiece
        return function(){
            if( !detailPiece ){
                detailPiece = avalon.define("detailPiece",function(vm){
                    vm.id=null
                    vm.pics=[]
                    vm.currentPic=0
                    vm.content = ""
                    vm.title = ""
                    vm.author = {
                        name : "",
                        signature : ""
                    }
                    vm.cover = ''
                    vm.metrics = {}
                    vm.metricsVal = {}
                    vm.eventMetrics = {}
                    vm.$skipArray = ['metircs']
                    vm.loading = false
                    vm.reset = function( piece){
                        vm.currentPic=0
                        // vm.pics =[]
                        _.extend( detailPiece, piece)
                        // console.log( vm.currentPic, vm)
                    }
                    vm.load = function( id ){
                        vm.loading = true
                        return util.api({
                            url:pieceAddr + id
                        }).done(function( piece){
                            console.log("DEB: load piece", piece)
                            vm.reset(piece)
                            if( piece.pics.length == 0 ){
                                vm.loading = false
                                resetGallary(vm)
                            }
                        })
                    }
                    vm.setEventMetrics = function( eventMetrics ){
                        vm.eventMetrics = eventMetrics
                        //becaus avalon's {{}} won't listen eventMetric
                        //we set metrics here
                        var pieceMetrics = _.clone(eventMetrics)
                        _.each(pieceMetrics,function(metric, key){
                            pieceMetrics[key].val = vm.metrics[key] === undefined? metric.bottom :vm.metrics[key]
                        })
                        vm.metricsVal = pieceMetrics
                        console.log("========seting metirc val", vm.metricsVal)

                    }
                    vm.piecePicsRendered = function(a){
                        if( a == "add" && detailPiece.id){
                            console.log("rendered!!!!!!",detailPiece.pics.length)
                            vm.loading = false
                            resetGallary(vm)
                        }
                    }
                })
            }

            return detailPiece
        }
    })()

    return exports

})
define(['./util'], function(util) {
    var exports = {},
        pieceAddr = "http://127.0.0.1:1337/piece/pieceWithPics/",
        sliderPrevSelector = ".slideController.prev",
        sliderNextSelector = ".slideController.next",
        piecePicSelector = ".piecePic"

    var resetGallary = (function(){
        var rendered = false,
            $slide,
            index = 0,
            rotater

        function slideTo( i ){
            if( i<0 || i> $slide.length-1){
                console.log("ERR: slide out of boudary",i,$slide.length)
            }
            $slide.css({"opacity":0,"z-index":1})
                .eq(i)
                .css({"opacity":1,"z-index":2});
        }

        return function( vm ){
            //reset global variables
            $slide = $(piecePicSelector)
            length = $slide.length

            if( rendered ){
                return 
            }else{
                //add event listener
                $(sliderNextSelector).click(function(){
                    if( index < length ){
                        slideTo( ++index )
                        vm.currentPic = index
                    }
                })

                $(sliderPrevSelector).click(function(){
                    if( index >0 ){
                        slideTo( --index )
                        vm.currentPic = index
                    }
                })

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
                    vm.set = function( piece){
                        _.extend( detailPiece, piece)
                        // console.log( vm.currentPic, vm)
                    }
                    vm.load = function( id ){
                        return util.api({
                            url:pieceAddr + id
                        }).done(function( piece){
                            console.log("DEB: load piece", piece)
                            vm.set(piece)
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
                    vm.detailPieceRendered = function(a){
                        if( a == "add" && detailPiece.id){
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
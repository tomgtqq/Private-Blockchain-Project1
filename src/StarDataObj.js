/* ===== StarDataObj Class ===================================
|  Class with a constructor for StarDataObj                	 |
|  ==========================================================*/

   /**
     * @param {*}   walletAddress
     * @param {Object}  starData - the data from client
     */ 
    
    class StarDataObj {
        constructor(walletAddress,starData){
            this.owner = walletAddress ,
            this.star = {
                ra: starData.ra,
                dec: starData.dec,
                mag: starData.mag,
                cen: starData.cen,
                story: new Buffer(starData.story ).toString('hex') // @Cool encode digital assets
            }
        }
        checkStarDataValidity(){
            if(this.star.ra && this.star.dec){
                return true ;
            }
        }
    }
    
    module.exports.StarDataObj = StarDataObj;   //@Cool  create obj here is better than in other file, becasue "data" sparate "controller"


const renderMain = async (req,res,next)=>{
    try {
        res.render('index')
        
    } catch (error) {
        console.log(error)
    }
} 

module.exports = {
    renderMain
}


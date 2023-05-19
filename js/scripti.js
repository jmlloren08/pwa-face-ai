const video = document.getElementById('videoInput')
let xcanvas = document.querySelector("#xcanvas");

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/DILGFACER/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/DILGFACER/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/DILGFACER/models') //heavier/accurate version of tiny face detector
]).then(start)

function start() {
    document.body.append('Models Loaded')
    
    navigator.getUserMedia(
        { video: {} },
        stream => {
          video.srcObject = stream
        },
        err => console.error(err)
      )
  
   recognizeFaces();
 
}

async function recognizeFaces() {

    const labeledDescriptors = await loadLabeledImages()
    //console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6)

   // video.onplay( () => {
        console.log('Playing')
        const canvas = faceapi.createCanvasFromMedia(video)
        document.body.append(canvas)

        const displaySize = { width: video.width, height: video.height }
        faceapi.matchDimensions(canvas, displaySize)

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()

            //Call this function to extract and display face
            extractFaceFromBox(video, detections[0].detection.box)

            const resizedDetections = faceapi.resizeResults(detections, displaySize)

            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            results.forEach( (result, i) => {
                const box = resizedDetections[i].detection.box
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                drawBox.draw(canvas)
                if(result.label == 'Zoilo'){
                    console.log(result.label)
                }else{
                    clearInterval()
                   // alert('df');
                }
            })
           
        }, 100)
    

    //})
}

let outputImage = document.getElementById('outputImage')

// This function extract a face from video frame with giving bounding box and display result into outputimage
async function extractFaceFromBox(inputImage, box){ 
    const regionsToExtract = [
        new faceapi.Rect( box.x, box.y , box.width , box.height)
    ]
                        
    let faceImages = await faceapi.extractFaces(inputImage, regionsToExtract)
    
    if(faceImages.length == 0){
        console.log('Face not found')
    }
    else
    {
        faceImages.forEach(cnv =>{      
            outputImage.src = cnv.toDataURL();      
        })
    }   
}  


function loadLabeledImages() {
    const labels = ['Black Widow', 'Captain America', 'Hawkeye' , 'Jim Rhodes', 'Tony Stark', 'Zoilo', 'Captain Marvel', 'Thor']
    //const labels = ['Zoilo'] // for WebCam
    return Promise.all(
        labels.map(async (label)=>{
            const descriptions = []
            for(let i=1; i<=3; i++) {
                const img = await faceapi.fetchImage(`/DILGFACER/labeled_images/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                console.log(label + i + JSON.stringify(detections))
                descriptions.push(detections.descriptor)
            }
           // document.body.append(label +' Faces Loadedx | ')
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}
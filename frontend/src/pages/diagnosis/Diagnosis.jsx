
import { useDarkMode } from "../../DarkModeContext";
import React, { useState, useEffect } from "react";
import Camera from "../../Camera";
import "./Diagnosis.css";

const Diagnosis = () => {
  const { isDarkMode, setDarkMode } = useDarkMode();
  const [image, setImage] = useState(null);
  const [base64data, setBase64data] = useState(null);
  const [result, setResult] = useState("");
  const [diseaseInfo, setDiseaseInfo] = useState(null);
  const [preview, setPreview] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [comment, setComment] = useState("");
  const [diagnosisId, setDiagnosisId] = useState(null); // Store diagnosis ID
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState();
  const [takePhotoClicked, setTakePhotoClicked] = useState(false);
  const [cameraPermission, setCameraPermission] = useState();

  const webcamRef = React.useRef(null);

  const turnOffCam = () => {
    setTakePhotoClicked((curr) => !curr);
  };

  const checkCameraPermission = async () => {
    if (!navigator.permissions) {
      console.warn("Permissions API not supported");
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: "camera" });
      setCameraPermission(result.state);

      result.onchange = () => {
        setCameraPermission(result.state);
      };
    } catch (error) {
      console.error("Error checking Camera Permissions:", error);
    }
  };

  const requestCameraAccess = async () => {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Camera access granted.");
      setCameraPermission("granted");
      stream.getTracks().forEach((track) => track.stop()); // Stop the camera stream
    } catch (error) {
      console.error("Camera Access Denied:", error);
      setCameraPermission("denied");
    }
  };

  const handleCapturedImage = (imageSrc) => {
    setImage(imageSrc);
    setBase64data(imageSrc.split(",")[1]); // Extract Base64 data
    setTakePhotoClicked(false); // Close camera after capture
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    setLoading(true)
    e.preventDefault();
    if (!image) {
      alert("Please upload an image.");
      setLoading(false)
      return;
    }
    console.log(result)
    const formData = new FormData();
    formData.append("image", image);
    const userId = sessionStorage.getItem("userId");
    formData.append("userId", userId);

    try {
      const response = await fetch(
        `http://${LOCAL_IP}:5000/api/diagnosis/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (data.diagnosisId) {
        setDiagnosisId(data.diagnosisId); // Capture diagnosis ID
      }
      if (data.disease_info) {
        setResult(
          data.diagnosis
        );
        setDiseaseInfo(data.disease_info);
        setLoading(false);
      } else if (data.output) {
        setResult(data.output);
        setLoading(false);
      } else {
        setResult("Failed to classify the image.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while uploading the image.");
      setLoading(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!comment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    if (!diagnosisId) {
      alert("Diagnosis ID is missing.");
      return;
    }

    try {
      const response = await fetch(
        `http://${LOCAL_IP}:5000/api/diagnosis/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            diagnosisId,
            comment,
          }),
        }
      );

      if (response.ok) {
        alert("Report submitted successfully.");
        setShowReportModal(false);
      } else {
        alert("Failed to submit report.");
      }
    } catch (error) {
      alert("Failed to submit report.");
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setWidth(() => window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    checkCameraPermission();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="diagnosisContainer" style={isDarkMode ? { color: "white", backgroundColor: "#2e302f" } : { color: "black" }}>
      <h3>Diagnose Your Plant</h3>
      <form className="uploadOptions" onSubmit={handleSubmit}>
        <div className="input">
          <label className="button" htmlFor="file-upload-button">
            Choose Image
          </label>
          <input
            id="file-upload-button"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
          {width <= 768 && (
            <>
              <p className="inputOption">Or</p>
              {cameraPermission === "granted" ? (
                <>
                  <button
                    className="button"
                    onClick={() => setTakePhotoClicked((curr) => !curr)}
                  >
                    {takePhotoClicked ? "Close Camera" : "Take Photo"}
                  </button>
                  {takePhotoClicked && (
                    <Camera
                      webcamRef={webcamRef}
                      onCapture={handleCapturedImage}
                      turnOffCam={turnOffCam}
                    />
                  )}
                </>
              ) : cameraPermission === "denied" ? (
                <p className="error">
                  Camera Access Denied. Please enable camera permission in your
                  browser settings.
                </p>
              ) : (
                <button className="button" onClick={requestCameraAccess}>
                  Enable Camera
                </button>
              )}
            </>
          )}
        </div>
        {preview && (
          <div className="finalUpload">
            <img src={preview} alt="Preview" />
            <button
              type="button"
              className="button custom-upload-button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Detecting..." : "Detect Disease"}
            </button>
          </div>
        )}
      </form>
      {result!="Not a leaf" ? diseaseInfo && (
        <div className="predictions" style={isDarkMode ? { color: "white", backgroundColor: "#242a23" } : { color: "black" }}>
          <div>
            <h4>Predictions:</h4>
            <div className="diseaseInfoContainer" >
              <p className="metaDname">
                <strong>Disease Name:</strong>
              </p>
              <p className="dname">{result.disease_name}</p>
              <p className="metaConf">
                <strong>Confidence:</strong>{" "}
              </p>
              <p className="conf">
                <div className="confidenceParent" style={{ width: "100%", backgroundColor: "grey", borderRadius: "20px", fontSize: '13px', color: 'white' }}>
                  <div className="confidenceindicator" style={{ borderRadius: "20px 20px 20px 20px", width: `${(parseFloat((result.confidence_score * 100).toFixed(0)) / 100) * 100}%`, backgroundColor: (result.confidence_score * 100).toFixed(0) > 90 ? " green" : (result.confidence_score * 100).toFixed(0) > 70 ? " rgb(252, 211, 3)" : " red", textAlign: "center" }}>{(result.confidence_score * 100).toFixed(1)}%</div>
                </div>
              </p>
            </div>
          </div>
          <div className="extraInfo">
            <h4>Disease Information</h4>
            <p>
              <strong>Symptoms:</strong>
              <p>{diseaseInfo.disease_symptoms}</p>
            </p>
            <p>
              <strong>Organic Treatment:</strong>
               <p>{diseaseInfo.organic_treatment}</p>
            </p>
            <p>
              <strong>Inorganic Treatment:</strong>{" "}
              <p>{diseaseInfo.inorganic_treatment}</p>
            </p>
            <p>
              <strong>Preventive Measures:</strong>{" "}
              <p>{diseaseInfo.preventive_measure}</p>
            </p>
            <p>
              <strong>Conclusion:</strong> 
              <p>{diseaseInfo.conclusion}</p>
            </p>
            <h4 className="notSat">Not Satisfied with the Result?</h4>
            <button onClick={() => setShowReportModal((curr) => !curr)}>
              Report and Diagnose
            </button>
          </div>
        </div>
      )
        : 
        <div className="metaDname" style={{marginTop:"20px",fontWeight:"bold",textAlign:"center",color:"red"}}>
          Please upload leaf image
        </div>
      }
      {showReportModal && (
        <div className="modal">
          <button className="close" onClick={() => setShowReportModal((curr) => !curr)}>X</button>
          <textarea
          className="desc"
            placeholder="Write your comments here..."
            value={comment}
            rows={7}
            cols={30}
            onChange={(e) => setComment(e.target.value)}
          />
          <button onClick={handleReportSubmit}>Submit Report</button>
        </div>
      )}
    </div>
  );
};

export default Diagnosis;

// import { RxCross1 } from "react-icons/rx";
// import ReactDOM from "react-dom";
// // import { useDarkMode } from "../DarkModeContext";

// export default function HistoryModal({onclose,disease,percentage,leaf}){
//     return ReactDOM.createPortal(
//         <div className="HistoryModalWrapper">
//             <div className="HistoryModalContainer" >
//                 <div className="crossMarkicon" onClick={onclose}>
//                     <RxCross1 />
//                 </div>
//                 <div className="HistoryimageContainer">
//                     <img src={leaf} alt="" />
//                 </div>
//                 <div className="HistoryDiseaseContainer">
//                     <h5>Disease Name: <span>{disease}</span></h5>
//                     <h5>Confidence Level: <span>{percentage}</span></h5>
//                     <div className="confidenceParent" style={{ width: "200px", backgroundColor: "grey", borderRadius: "20px" }}>
//                         <div className="confidenceindicator" style={{ borderRadius: "20px", width: `${(parseFloat(percentage) / 100) * 200}px`, border: percentage > "90" ? "3px solid green" : percentage > "70" ? "3px solid rgb(252, 211, 3)" : "3px solid red" }}></div>
//                     </div>
//                 </div>
//                 <div className="HistoryLine" style={isDarkMode ? { border: "1px solid grey" } : {}}></div>
//             </div> 
//         </div>,
//         document.getElementById("historyPortal")
//     );
// }
import { RxCross1 } from "react-icons/rx";
import ReactDOM from "react-dom";

export default function HistoryModal({ onclose, disease, percentage, leaf, details }) {
  console.log(details);

  return ReactDOM.createPortal(
    <div className="HistoryModalWrapper">
      <div className="HistoryModalContainer">
        <div className="crossMarkicon" onClick={onclose}>
          <RxCross1 />
        </div>
        <div className="HistoryimageContainer">
          <img src={leaf} alt={`Leaf affected by ${disease}`} />
        </div>
        <div className="HistoryDiseaseContainer">
          <h5>
            Disease Name: <span>{disease}</span>
          </h5>
          <h5>
            Confidence Level: <span>{percentage}</span>
          </h5>
          <div className="confidenceParent">
            <div
              className="confidenceindicator"
              style={{
                borderRadius: "20px",
                width: `${(parseFloat(percentage) / 100) * 200}px`,
                border:
                  percentage > "90"
                    ? "3px solid green"
                    : percentage > "70"
                    ? "3px solid rgb(252, 211, 3)"
                    : "3px solid red",
              }}
            ></div>
          </div>

          {/* Conditionally Render Details if Present */}
          {details && (
            <div>
              {details.disease_symptoms && (
                <p>
                  <strong>Symptoms:</strong>
                  <span>{details.disease_symptoms}</span>
                </p>
              )}
              {details.organic_treatment && (
                <p>
                  <strong>Organic Treatment:</strong>
                  <span>{details.organic_treatment}</span>
                </p>
              )}
              {details.inorganic_treatment && (
                <p>
                  <strong>Inorganic Treatment:</strong>
                  <span>{details.inorganic_treatment}</span>
                </p>
              )}
              {details.preventive_measure && (
                <p>
                  <strong>Preventive Measures:</strong>
                  <span>{details.preventive_measure}</span>
                </p>
              )}
              {details.conclusion && (
                <p>
                  <strong>Conclusion:</strong>
                  <span>{details.conclusion}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="HistoryLine"></div>
      </div>
    </div>,
    document.getElementById("historyPortal")
  );
}

import { useEffect, useRef, useState } from "react";
import uniqid from "uniqid";
import { assets } from "../../assets/assets";
import Quill from "quill";

const AddCourse = () => {
  const quilRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: "",
    lectureDuration: "",
    lectureUrl: "",
    isPreviewFree: false,
  });

  const handleChapter = (action, chapterId) => {
    if (action === "add") {
      const title = prompt("Enter Chapter Name:");
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder: chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === "remove") {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
    } else if (action === "toggle") {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
        )
      );
    }
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === "add") {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === "remove") {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1);
          }
          return chapter;
        })
      );
    }
  };

  const addLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureId: uniqid(),
            lectureOrder:
              chapter.chapterContent.length > 0
                ? chapter.chapterContent[chapter.chapterContent.length - 1].lectureOrder + 1
                : 1,
          };
          chapter.chapterContent.push(newLecture);
        }
        return chapter;
      })
    );
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: "",
      lectureDuration: "",
      lectureUrl: "",
      isPreviewFree: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (!quilRef.current && editorRef.current) {
      quilRef.current = new Quill(editorRef.current, {
        theme: "snow",
      });
    }
  }, []);

  return (
    <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md w-full text-gray-500">
        <div className="flex flex-col gap-1">
          <p>Course Title</p>
          <input
            value={courseTitle}
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
            required
            type="text"
            onChange={(e) => setCourseTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <p>Course Desccription</p>
          <div className="" ref={editorRef}></div>
        </div>

        <div className="flex items-center justify-between flex-wrap">
          <div className="flex flex-col gap-1">
            <p>Course Price</p>
            <input
              onChange={(e) => setCoursePrice(e.target.value)}
              value={coursePrice}
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500"
              required
            />
          </div>
          <div className="flex md:flex-row flex-col items-center gap-3">
            <p>Course Thumbnail</p>
            <label htmlFor="thumbnailImage" className="flex items-center gap-3">
              <img src={assets.file_upload_icon} alt="" className="p-3 bg-blue-500 rounded" />
              <input
                type="file"
                id="thumbnailImage"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
                hidden
              />
              <img className="max-h-10" src={image ? URL.createObjectURL(image) : null} alt="" />
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p>Discount %</p>
          <input
            className="outline-none md:p-2.5 py-2 w-28 px-3 rounded border border-gray-500"
            required
            placeholder="0"
            min={0}
            max={100}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            type="number"
          />
        </div>
        {/* Adding Chapters and Lectures */}
        <div className="">
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className="bg-white border rounded-lg mb-4">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center">
                  <img
                    onClick={() => handleChapter("toggle", chapter.chapterId)}
                    className={`mr-2 cursor-pointer transition-all ${
                      chapter.collapsed && "-rotate-90"
                    }`}
                    src={assets.dropdown_icon}
                    width={14}
                    alt=""
                  />
                  <span className="font-semibold">
                    {chapterIndex + 1} {chapter.chapterTitle}
                  </span>
                </div>
                <span className="text-gray-500">{chapter.chapterContent.length} Lectures</span>
                <img
                  onClick={() => handleChapter("remove", chapter.chapterId)}
                  src={assets.cross_icon}
                  alt=""
                  className="cursor-pointer"
                />
              </div>
              {!chapter.collapsed && (
                <div className="p-4">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div className="flex justify-between items-center mb-2" key={lectureIndex}>
                      <span>
                        {lectureIndex + 1} {lecture.lectureTitle} - {lecture.lectureDuration} mins -
                        <a href={lecture.lectureUrl} target="_blank" className="text-primary">
                          Link
                        </a>
                        - {lecture.isPreviewFree ? "Free Preview" : "Paid"}
                      </span>
                      <img
                        onClick={() => handleLecture("remove", chapter.chapterId, lectureIndex)}
                        src={assets.cross_icon}
                        alt=""
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                  <div
                    onClick={() => handleLecture("add", chapter.chapterId, chapterIndex)}
                    className="inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2">
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}
          <div
            onClick={() => handleChapter("add")}
            className="flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer">
            + Add Chapter
          </div>

          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800/50">
              <div className="bg-white text-gray-700 p-4 rounded relative w-full max-w-80">
                <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>

                <div className="mb-2">
                  <p>Lecture Title</p>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureTitle}
                    onChange={(e) =>
                      setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })
                    }
                  />
                </div>

                <div className="mb-2">
                  <p>Duration (minutes)</p>
                  <input
                    type="number"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureDuration}
                    onChange={(e) =>
                      setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })
                    }
                  />
                </div>

                <div className="mb-2">
                  <p>Lecture Url</p>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureUrl}
                    onChange={(e) =>
                      setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2 mb-4">
                  <p>Is Preview Free?</p>
                  <input
                    type="checkbox"
                    className="mt-1 scale-125"
                    checked={lectureDetails.isPreviewFree}
                    onChange={(e) =>
                      setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })
                    }
                  />
                </div>
                <button
                  onClick={addLecture}
                  type="button"
                  className="w-full bg-blue-400 text-white px-4 py-2 rounded">
                  Add
                </button>
                <img
                  className="absolute top-4 right-4 w-2.5 cursor-pointer"
                  onClick={() => setShowPopup(false)}
                  src={assets.cross_icon}
                  alt=""
                />
              </div>
            </div>
          )}
        </div>
        <button type="submit" className="bg-black text-white w-max py-2.5 px-8 rounded my-4">
          Add
        </button>
      </form>
    </div>
  );
};

export default AddCourse;

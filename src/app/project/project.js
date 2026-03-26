const createBtn = document.getElementById("createBtn");
    const assignForm = document.getElementById("assignTaskForm");
    const closeForm = document.getElementById("closeForm");
    const taskDetails = document.getElementById("taskDetails");
    const charCount = document.getElementById("charCount");
    const toast = document.getElementById("toast");
    const form = document.getElementById("taskForm");
    const fileUpload = document.getElementById("fileUpload");
    const filePreview = document.getElementById("filePreview");

    // Show form
    createBtn.addEventListener("click", () => {
      assignForm.style.display = "block";
    });

    // Hide form
    closeForm.addEventListener("click", () => {
      assignForm.style.display = "none";
    });

    // Char count update
    taskDetails.addEventListener("input", () => {
      charCount.textContent = `${taskDetails.value.length} / 200`;
    });

    // File preview logic
    fileUpload.addEventListener("change", () => {
      const file = fileUpload.files[0];
      if (file) {
        const icon = file.type.startsWith("image/")
          ? "🖼️"
          : file.type === "application/pdf"
          ? "📄"
          : "📎";
        filePreview.innerHTML = `<i>${icon}</i> ${file.name}`;
      } else {
        filePreview.innerHTML = "";
      }
    });

    // Show toast
    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3000);
    }

    // Form submit
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.reset();
      charCount.textContent = "0 / 200";
      filePreview.innerHTML = "";
      assignForm.style.display = "none";
      showToast("✅ Task Assigned Successfully!");
    });

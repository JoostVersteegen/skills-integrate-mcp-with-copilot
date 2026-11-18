document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signupContainer = document.getElementById("signup-container");
  const teacherNotice = document.getElementById("teacher-notice");
  const accountButton = document.getElementById("account-button");
  const accountPanel = document.getElementById("account-panel");
  const accountStatus = document.getElementById("account-status");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  let currentTeacher = null;

  function setTeacher(username) {
    currentTeacher = username;
    signupContainer.classList.toggle("hidden", !username);
    teacherNotice.classList.toggle("hidden", Boolean(username));
    accountStatus.textContent = username ? `Signed in as ${username}` : "Not signed in";
    loginButton.classList.toggle("hidden", Boolean(username));
    logoutButton.classList.toggle("hidden", !username);
  }

  function showMessage(element, text, className) {
    element.textContent = text;
    element.className = className;
    element.classList.remove("hidden");
    setTimeout(() => element.classList.add("hidden"), 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Failed to load activities");
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) => `<li>
                      <span class="participant-email">${email}</span>
                      ${
                        currentTeacher
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}" aria-label="Unregister ${email} from ${name}">Remove</button>`
                          : ""
                      }
                    </li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      activitiesList.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else if (response.status === 401) {
        setTeacher(null);
        showMessage(messageDiv, "Your teacher session has expired. Please log in again.", "error");
        fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  accountButton.addEventListener("click", () => {
    const isOpen = !accountPanel.classList.contains("hidden");
    accountPanel.classList.toggle("hidden", isOpen);
    accountButton.setAttribute("aria-expanded", String(!isOpen));
  });

  loginButton.addEventListener("click", () => {
    accountPanel.classList.add("hidden");
    accountButton.setAttribute("aria-expanded", "false");
    loginMessage.classList.add("hidden");
    loginForm.reset();
    loginDialog.showModal();
  });

  document.getElementById("cancel-login").addEventListener("click", () => {
    loginDialog.close();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        showMessage(loginMessage, result.detail || "Unable to log in.", "error");
        return;
      }

      setTeacher(result.username);
      loginDialog.close();
      await fetchActivities();
    } catch (error) {
      showMessage(loginMessage, "Failed to log in. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Logout request failed");
      }
      setTeacher(null);
      accountPanel.classList.add("hidden");
      accountButton.setAttribute("aria-expanded", "false");
      await fetchActivities();
    } catch (error) {
      showMessage(messageDiv, "Failed to log out. Please try again.", "error");
      console.error("Error logging out:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else if (response.status === 401) {
        setTeacher(null);
        showMessage(messageDiv, "Your teacher session has expired. Please log in again.", "error");
        fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetch("/auth/me")
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }
      return (await response.json()).username;
    })
    .then((username) => {
      setTeacher(username);
      return fetchActivities();
    })
    .catch((error) => {
      setTeacher(null);
      console.error("Error restoring teacher session:", error);
      return fetchActivities();
    });
});

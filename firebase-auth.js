
(function(){

  var firebaseConfig = {
    apiKey: "AIzaSyBTNIg29kbCt-GhFenHNZa34Xkl8M4k8cw",
    authDomain: "block-5acdc.firebaseapp.com",
    projectId: "block-5acdc",
    storageBucket: "block-5acdc.appspot.com",
    messagingSenderId: "57460143611",
    appId: "1:57460143611:web:3efd4e65ab5898b59fc75e",
    measurementId: "G-31XZGSV3WT"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    try { firebase.analytics(); } catch(e) {}
  }

  const auth = firebase.auth();
  const db   = firebase.firestore();


  async function saveUserByEmail(email, name, role) {
    if (!email) return;
    const docId = email; 
    const userData = {
      email: email,
      name: name || "",
      role: role || "Student",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const updates = [];
    updates.push(db.collection("AllUsers").doc(docId).set(userData, { merge: true }));
    if (role && role.toLowerCase() === "teacher") {
      updates.push(db.collection("teachers").doc(docId).set(userData, { merge: true }));
    } else {
      updates.push(db.collection("students").doc(docId).set(userData, { merge: true }));
    }
    await Promise.all(updates);
  }

  // Google sign-in flow. role must be 'Student' or 'Teacher'
  async function signInWithGoogle(role) {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      if (!user) throw new Error("No user returned from Google sign-in");
      const email = user.email;
      const name = user.displayName || "";
      // Save to Firestore according to selected role
      await saveUserByEmail(email, name, role);
      // Redirect based on role
      if (role && role.toLowerCase() === "teacher") {
        window.location.href = "dashboard_teach.html";
      } else {
        window.location.href = "dashboard_stud.html";
      }
    } catch (err) {
      console.error("Google sign-in failed:", err);
      // Handle account-exists-with-different-credential gracefully
      if (err.code === 'auth/account-exists-with-different-credential') {
        alert("An account already exists with the same email address but different sign-in credentials. Please sign in using your original method and link accounts in your profile.");
      } else {
        alert("Google sign-in failed: " + (err.message || err));
      }
    }
  }

  // Email/password login (reads role from AllUsers to redirect)
  async function emailPasswordLogin(email, password, roleHint) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      // Try to get the role from Firestore (AllUsers)
      const doc = await db.collection("AllUsers").doc(email).get();
      let role = roleHint || "Student";
      if (doc.exists) {
        const data = doc.data();
        if (data && data.role) role = data.role;
      }
      // Redirect
      if (role && role.toLowerCase() === "teacher") {
        window.location.href = "dashboard_teach.html";
      } else {
        window.location.href = "dashboard_stud.html";
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed: " + (err.message || err));
    }
  }

  // Email/password signup (creates auth user and writes to Firestore)
  async function emailPasswordSignup(name, email, password, role) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      // Save user info in Firestore
      await saveUserByEmail(email, name, role);
      // Redirect
      if (role && role.toLowerCase() === "teacher") {
        window.location.href = "dashboard_teach.html";
      } else {
        window.location.href = "dashboard_stud.html";
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup failed: " + (err.message || err));
    }
  }

  // Expose functions to global scope for HTML pages to call
  window.FirebaseAuthApp = {
    signInWithGoogle,
    emailPasswordLogin,
    emailPasswordSignup,
    auth // expose auth if page wants to use onAuthStateChanged
  };


  auth.onAuthStateChanged((user) => {
    if (user) {
      // console.log("Auth state: signed in", user.email);
    } else {
      // console.log("Auth state: signed out");
    }
  });
})();
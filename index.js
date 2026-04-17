const baseUri = "https://restdanmarksradio20260413105959-cgg9b0ade5fda5c2.swedencentral-01.azurewebsites.net";

Vue.createApp({
    data() {
        return {
            records: [],
            searchArtist: "",
            searchTitle: "",
            currentIndex: 0,
            editing: false,
            adding: false,
            isLoggedIn: false,
            showLogin: true,
            loginForm: {
                username: "",
                password: ""
            },
            loginError: false,
            editRecord: {
                id: null,
                artist: "",
                title: "",
                duration: 0,
                publicationYear: 0
            },
            newRecord: {
                artist: "",
                title: "",
                duration: 0,
                publicationYear: 0
            }
        }
    },

    async mounted() {
        // Check for token in localStorage
        const token = localStorage.getItem("token");
        if (token) {
            this.isLoggedIn = true;
            this.showLogin = false;
        }
        await this.fetchRecords(); // fetches always, also for guests
    },

    computed: {
        filteredRecords() {
            let filtered = this.records;
            if (this.searchArtist) {
                const sA = this.searchArtist.toLowerCase();
                filtered = filtered.filter(r => r.artist && r.artist.toLowerCase().includes(sA));
            }
            if (this.searchTitle) {
                const sT = this.searchTitle.toLowerCase();
                filtered = filtered.filter(r => r.title && r.title.toLowerCase().includes(sT));
            }
            return filtered;
        }
    },

    methods: {
        async login() {
            this.loginError = false;
            try {
                const response = await fetch(baseUri + "/api/Auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: this.loginForm.username,
                        password: this.loginForm.password
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    const token = data.token || data.jwt;
                    if (token) {
                        localStorage.setItem("token", token);
                        this.isLoggedIn = true;
                        this.loginForm.username = "";
                        this.loginForm.password = "";
                        await this.fetchRecords();
                        this.showLogin = false;
                    } else {
                        this.loginError = true;
                    }
                } else {
                    this.loginError = true;
                }
            } catch (e) {
                this.loginError = true;
            }
        },

        skipLogin() {
            this.showLogin = false;
        },

        logout() {
            localStorage.removeItem("token");
            this.isLoggedIn = false;
            this.showLogin = true;
            this.records = [];
        },

        async fetchRecords() {
            // GET virker altid, også uden token
            const token = localStorage.getItem("token");
            const response = await fetch(baseUri + "/api/records", {
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            if (response.ok) {
                this.records = await response.json();
                if (this.currentIndex >= this.records.length) {
                    this.currentIndex = 0;
                }
            } else if (response.status === 401 && this.isLoggedIn) {
                this.logout();
            }
        },

        nextRecord() {
            this.currentIndex = (this.currentIndex + 1) % this.records.length;
        },

        prevRecord() {
            this.currentIndex = (this.currentIndex - 1 + this.records.length) % this.records.length;
        },

        startEdit(record) {
            this.editing = true;
            this.editRecord = { ...record };
        },

        cancelEdit() {
            this.editing = false;
            this.editRecord = {
                id: null,
                artist: "",
                title: "",
                duration: 0,
                publicationYear: 0
            };
        },

        async saveEdit() {
            if (!this.isLoggedIn) return;
            try {
                const token = localStorage.getItem("token");
                await fetch(baseUri + "/api/records/" + this.editRecord.id, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { "Authorization": `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(this.editRecord)
                });
                this.editing = false;
                await this.fetchRecords();
            } catch (error) {
                console.error("Error updating record:", error);
            }
        },

        async addRecord() {
            if (!this.isLoggedIn) return;
            const token = localStorage.getItem("token");
            await fetch(baseUri + "/api/records", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(this.newRecord)
            });
            this.newRecord = {
                artist: "",
                title: "",
                duration: 0,
                publicationYear: 0
            };
            this.adding = false;
            await this.fetchRecords();
        },

        async deleteRecord(id) {
            if (!this.isLoggedIn) return;
            const token = localStorage.getItem("token");
            await fetch(baseUri + "/api/records/" + id, {
                method: "DELETE",
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            await this.fetchRecords();
        }
    }
}).mount("#app");
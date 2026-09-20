(function () {
    function installAutoAuth() {
        if (!window.ui || typeof window.ui.getConfigs !== "function") {
            setTimeout(installAutoAuth, 300);
            return;
        }

        const config = window.ui.getConfigs();

        config.persistAuthorization = true;

        config.responseInterceptor = function (response) {
            try {
                if (
                    response &&
                    response.url &&
                    response.url.includes("/api/auth/login") &&
                    Number(response.status) === 200
                ) {
                    let body = response.body;

                    if (typeof body === "string") {
                        body = JSON.parse(body);
                    }

                    if (
                        body &&
                        body.token &&
                        window.ui &&
                        typeof window.ui.preauthorizeApiKey === "function"
                    ) {
                        window.ui.preauthorizeApiKey(
                            "bearerAuth",
                            body.token
                        );

                        console.log(
                            "Swagger JWT authorized automatically."
                        );
                    }
                }
            } catch (error) {
                console.warn(
                    "Swagger auto authorization failed:",
                    error
                );
            }

            return response;
        };

        console.log("Swagger auto authorization ready.");
    }

    installAutoAuth();
})();

// Generated from docs/backend/approved-openapi.json.
// Run `npm run api:types` to update this file.
// Do not edit by hand.

export interface components {
  schemas: {
    LocalizationRequest: {
      messageKey: string;
      language: string;
      messageText: string;
      description?: string;
    };
    LocalizationResponse: {
      id?: number;
      messageKey?: string;
      language?: string;
      messageText?: string;
      description?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    CategoryUpdateRequest: {
      name: string;
    };
    Category: {
      id?: number;
      name?: string;
    };
    ApiProblemResponse: {
      title?: string;
      status?: number;
      detail?: string;
      messageKey?: string;
      message?: string;
      language?: string;
    };
    BookUpdateRequest: {
      title: string;
      author: string;
      version: number;
      publicationYear: number;
      categories?: string[];
    };
    Book: {
      id?: number;
      version?: number;
      title?: string;
      author?: string;
      isbn?: string;
      publicationYear?: number;
      categories?: components['schemas']["Category"][];
    };
    AdminUserRoleUpdateRequest: {
      roles: Array<"USER" | "ADMIN">;
      reason: string;
    };
    AdminUserAccountResponse: {
      id?: number;
      provider?: string;
      login?: string;
      displayName?: string;
      email?: string;
      preferredLanguage?: string;
      roles?: string[];
      roleGrants?: components['schemas']["AdminUserRoleGrantResponse"][];
      lastLoginAt?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    AdminUserRoleGrantResponse: {
      role?: string;
      source?: "AUTHENTICATED_LOGIN" | "BOOTSTRAP" | "ADMIN_MANAGED";
      grantedAt?: string;
      grantedByUserId?: number;
      grantedByLogin?: string;
      reason?: string;
    };
    UserAccountLanguageRequest: {
      preferredLanguage?: string;
    };
    UserAccountResponse: {
      id?: number;
      provider?: string;
      login?: string;
      displayName?: string;
      email?: string;
      preferredLanguage?: string;
      roles?: string[];
      lastLoginAt?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    CategoryCreateRequest: {
      name: string;
    };
    BookCreateRequest: {
      title: string;
      author: string;
      isbn: string;
      publicationYear: number;
      categories?: string[];
    };
    SessionCookieContract: {
      name?: string;
      httpOnly?: boolean;
      sameSite?: string;
      secure?: boolean;
    };
    SessionCsrfContract: {
      enabled?: boolean;
      cookieName?: string;
      headerName?: string;
    };
    SessionLoginProvider: {
      registrationId?: string;
      clientName?: string;
      authorizationPath?: string;
    };
    SessionResponse: {
      authenticated?: boolean;
      accountPath?: string;
      loginProviders?: components['schemas']["SessionLoginProvider"][];
      logoutPath?: string;
      sessionCookie?: components['schemas']["SessionCookieContract"];
      csrf?: components['schemas']["SessionCsrfContract"];
    };
    PageLocalizationResponse: {
      totalPages?: number;
      totalElements?: number;
      size?: number;
      content?: components['schemas']["LocalizationResponse"][];
      number?: number;
      first?: boolean;
      last?: boolean;
      numberOfElements?: number;
      sort?: components['schemas']["SortObject"];
      pageable?: components['schemas']["PageableObject"];
      empty?: boolean;
    };
    PageableObject: {
      offset?: number;
      unpaged?: boolean;
      paged?: boolean;
      sort?: components['schemas']["SortObject"];
      pageSize?: number;
      pageNumber?: number;
    };
    SortObject: {
      empty?: boolean;
      unsorted?: boolean;
      sorted?: boolean;
    };
    PageBook: {
      totalPages?: number;
      totalElements?: number;
      size?: number;
      content?: components['schemas']["Book"][];
      number?: number;
      first?: boolean;
      last?: boolean;
      numberOfElements?: number;
      sort?: components['schemas']["SortObject"];
      pageable?: components['schemas']["PageableObject"];
      empty?: boolean;
    };
    AbuseProtectionDetails: {
      owner?: string;
      loginBootstrapPathTemplate?: string;
      loginBootstrapControls?: string[];
      unsafeWritePathPattern?: string;
      unsafeWriteExamples?: string[];
      unsafeWriteControls?: string[];
    };
    AuditLogResponse: {
      id?: number;
      targetType?: "BOOK" | "CATEGORY" | "LOCALIZATION_MESSAGE" | "USER_ACCOUNT" | "AUTHENTICATION";
      targetId?: number;
      action?: "CREATE" | "UPDATE" | "DELETE" | "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "LOGOUT" | "SESSION_REJECTION";
      actorLogin?: string;
      summary?: string;
      details?: Record<string, Record<string, unknown>>;
      createdAt?: string;
    };
    BuildDetails: {
      name?: string;
      group?: string;
      artifact?: string;
      version?: string;
      time?: string;
    };
    ConfigurationDetails: {
      pagination?: components['schemas']["PaginationDetails"];
      session?: components['schemas']["SessionDetails"];
      observability?: components['schemas']["ObservabilityDetails"];
      documentation?: components['schemas']["DocumentationDetails"];
      security?: components['schemas']["SecurityDetails"];
      shutdown?: components['schemas']["ShutdownDetails"];
    };
    DocumentationDetails: {
      html?: string;
      openApiJson?: string;
      openApiYaml?: string;
      openApiVersion?: string;
    };
    GitDetails: {
      branch?: string;
      commitId?: string;
      shortCommitId?: string;
      commitTime?: string;
    };
    ObservabilityDetails: {
      exposedEndpoints?: string[];
      healthProbesEnabled?: boolean;
      tracingSamplingProbability?: number;
    };
    OperatorAuditSection: {
      auditLogEndpoint?: string;
      totalEntries?: number;
      recentEntries?: components['schemas']["AuditLogResponse"][];
    };
    OperatorOperationalStatus: {
      actuatorHealthEndpoint?: string;
      actuatorInfoEndpoint?: string;
      actuatorPrometheusEndpoint?: string;
      applicationHealthStatus?: string;
      livenessState?: string;
      readinessState?: string;
    };
    OperatorRuntimeDiagnostics: {
      technicalOverviewEndpoint?: string;
      technicalOverview?: components['schemas']["TechnicalOverviewResponse"];
    };
    OperatorSurfaceResponse: {
      audit?: components['schemas']["OperatorAuditSection"];
      runtime?: components['schemas']["OperatorRuntimeDiagnostics"];
      operations?: components['schemas']["OperatorOperationalStatus"];
    };
    PaginationDetails: {
      defaultPageSize?: number;
      maxPageSize?: number;
    };
    RuntimeDetails: {
      applicationName?: string;
      javaVersion?: string;
      javaVendor?: string;
      activeProfiles?: string[];
    };
    SecurityDetails: {
      csrfEnabled?: boolean;
      csrfCookieName?: string;
      csrfHeaderName?: string;
      oauthProfileActive?: boolean;
      publicApiPathPattern?: string;
      oauthAuthorizationBasePath?: string;
      oauthCallbackPathTemplate?: string;
      forwardHeadersStrategy?: string;
      abuseProtection?: components['schemas']["AbuseProtectionDetails"];
    };
    SessionDetails: {
      storeType?: string;
      timeout?: string;
      cookieName?: string;
      cookieHttpOnly?: boolean;
      cookieSameSite?: string;
    };
    ShutdownDetails: {
      serverShutdown?: string;
      timeoutPerShutdownPhase?: string;
    };
    TechnicalOverviewResponse: {
      build?: components['schemas']["BuildDetails"];
      git?: components['schemas']["GitDetails"];
      runtime?: components['schemas']["RuntimeDetails"];
      dependencies?: Record<string, string>;
      configuration?: components['schemas']["ConfigurationDetails"];
    };
    AuditLogPageResponse: {
      content?: components['schemas']["AuditLogResponse"][];
      pageable?: Record<string, unknown>;
      sort?: Record<string, unknown>;
      totalPages?: number;
      totalElements?: number;
      last?: boolean;
      size?: number;
      number?: number;
      numberOfElements?: number;
      first?: boolean;
      empty?: boolean;
    };
  }
}

export interface operations {
  findById: {
    parameters: {
      path: {
        id: number;
      };
    };
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["LocalizationResponse"];
        };
      };
    };
  };
  update: {
    parameters: {
      path: {
        id: number;
      };
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody: {
      content: {
        "application/json": components['schemas']["LocalizationRequest"];
      };
    };
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["LocalizationResponse"];
        };
      };
    };
  };
  delete: {
    parameters: {
      path: {
        id: number;
      };
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody?: never;
    responses: {
      "200": { content?: never };
    };
  };
  update_1: {
    parameters: {
      path: {
        id: number;
      };
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody: {
      content: {
        "application/json": components['schemas']["CategoryUpdateRequest"];
      };
    };
    responses: {
      "200": {
        content: {
          "application/json": components['schemas']["Category"];
        };
      };
      "401": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "403": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "404": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
    };
  };
  delete_1: {
    parameters: {
      path: {
        id: number;
      };
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody?: never;
    responses: {
      "204": { content?: never };
      "401": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "403": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "404": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "409": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
    };
  };
  findById_1: {
    parameters: {
      path: {
        id: number;
      };
    };
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["Book"];
        };
      };
    };
  };
  update_2: {
    parameters: {
      path: {
        id: number;
      };
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody: {
      content: {
        "application/json": components['schemas']["BookUpdateRequest"];
      };
    };
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["Book"];
        };
      };
    };
  };
  delete_2: {
    parameters: {
      path: {
        id: number;
      };
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody?: never;
    responses: {
      "200": { content?: never };
    };
  };
  replaceRoles: {
    parameters: {
      path: {
        id: number;
      };
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody: {
      content: {
        "application/json": components['schemas']["AdminUserRoleUpdateRequest"];
      };
    };
    responses: {
      "200": {
        content: {
          "application/json": components['schemas']["AdminUserAccountResponse"];
        };
      };
      "400": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "401": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "403": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "404": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
    };
  };
  updatePreferredLanguage: {
    parameters: {
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody: {
      content: {
        "application/json": components['schemas']["UserAccountLanguageRequest"];
      };
    };
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["UserAccountResponse"];
        };
      };
    };
  };
  logout: {
    parameters?: {
      header?: {
        "X-XSRF-TOKEN"?: string;
      };
    };
    requestBody?: never;
    responses: {
      "204": { content?: never };
    };
  };
  findAll: {
    parameters?: {
      query?: {
        messageKey?: string;
        language?: string;
        page?: number;
        size?: number;
        sort?: string[];
      };
    };
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["PageLocalizationResponse"];
        };
      };
    };
  };
  create: {
    parameters: {
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody: {
      content: {
        "application/json": components['schemas']["LocalizationRequest"];
      };
    };
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["LocalizationResponse"];
        };
      };
    };
  };
  findAll_1: {
    parameters?: never;
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["Category"][];
        };
      };
    };
  };
  create_1: {
    parameters: {
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody: {
      content: {
        "application/json": components['schemas']["CategoryCreateRequest"];
      };
    };
    responses: {
      "201": {
        content: {
          "application/json": components['schemas']["Category"];
        };
      };
      "401": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "403": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
    };
  };
  findAll_2: {
    parameters?: {
      query?: {
        title?: string;
        author?: string;
        isbn?: string;
        year?: number;
        yearFrom?: number;
        yearTo?: number;
        category?: string[];
        page?: number;
        size?: number;
        sort?: string[];
      };
    };
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["PageBook"];
        };
      };
    };
  };
  create_2: {
    parameters: {
      header: {
        "X-XSRF-TOKEN": string;
      };
    };
    requestBody: {
      content: {
        "application/json": components['schemas']["BookCreateRequest"];
      };
    };
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["Book"];
        };
      };
    };
  };
  currentSession: {
    parameters?: never;
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["SessionResponse"];
        };
      };
    };
  };
  listUsers: {
    parameters?: never;
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "application/json": components['schemas']["AdminUserAccountResponse"][];
        };
      };
      "401": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "403": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
    };
  };
  getSurface: {
    parameters?: never;
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "application/json": components['schemas']["OperatorSurfaceResponse"];
        };
      };
      "401": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "403": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
    };
  };
  findAll_3: {
    parameters?: {
      query?: {
        targetType?: "BOOK" | "CATEGORY" | "LOCALIZATION_MESSAGE" | "USER_ACCOUNT" | "AUTHENTICATION";
        action?: "CREATE" | "UPDATE" | "DELETE" | "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "LOGOUT" | "SESSION_REJECTION";
        actorLogin?: string;
        page?: number;
        size?: number;
        sort?: string[];
      };
    };
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "application/json": components['schemas']["AuditLogPageResponse"];
        };
      };
      "401": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
      "403": {
        content: {
          "application/problem+json": components['schemas']["ApiProblemResponse"];
        };
      };
    };
  };
  currentUser: {
    parameters?: never;
    requestBody?: never;
    responses: {
      "200": {
        content: {
          "*/*": components['schemas']["UserAccountResponse"];
        };
      };
    };
  };
}

export interface paths {
  "/api/localizations/{id}": {
    get: operations["findById"];
    put: operations["update"];
    delete: operations["delete"];
  };
  "/api/categories/{id}": {
    put: operations["update_1"];
    delete: operations["delete_1"];
  };
  "/api/books/{id}": {
    get: operations["findById_1"];
    put: operations["update_2"];
    delete: operations["delete_2"];
  };
  "/api/admin/users/{id}/roles": {
    put: operations["replaceRoles"];
  };
  "/api/account/language": {
    put: operations["updatePreferredLanguage"];
  };
  "/api/session/logout": {
    post: operations["logout"];
  };
  "/api/localizations": {
    get: operations["findAll"];
    post: operations["create"];
  };
  "/api/categories": {
    get: operations["findAll_1"];
    post: operations["create_1"];
  };
  "/api/books": {
    get: operations["findAll_2"];
    post: operations["create_2"];
  };
  "/api/session": {
    get: operations["currentSession"];
  };
  "/api/admin/users": {
    get: operations["listUsers"];
  };
  "/api/admin/operator-surface": {
    get: operations["getSurface"];
  };
  "/api/admin/audit-logs": {
    get: operations["findAll_3"];
  };
  "/api/account": {
    get: operations["currentUser"];
  };
}

export type ApiPath = keyof paths
export type ApiOperationId = keyof operations

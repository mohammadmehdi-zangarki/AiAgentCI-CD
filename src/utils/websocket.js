export const getWebSocketUrl = (path) => {
    const url = new URL(process.env.REACT_APP_PYTHON_APP_API_URL);
    
    // Check for forced protocol first
    const forcedProtocol = process.env.REACT_APP_FORCE_WEBSOCKET_PROTOCOL;
    const protocol = forcedProtocol 
        ? `${forcedProtocol}:` 
        : window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.hostname}:${url.port}${path}`;
}; 
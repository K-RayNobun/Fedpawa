<?php
namespace App;

use App\Exception\NotFoundException;

class Router {
    private array $routes = [];

    public function post(string $path, string $handler): void {
        $this->routes['POST'][$path] = $handler;
    }

    public function get(string $path, $handler): void {
        $this->routes['GET'][$path] = $handler;
    }

    public function dispatch(string $uri, string $method): void {
        $method = strtoupper($method);
        $path = parse_url($uri, PHP_URL_PATH);
        
        if (isset($this->routes[$method][$path])) {
            $handler = $this->routes[$method][$path];
            if (is_callable($handler)) {
                $handler();
            } else {
                [$controllerName, $methodName] = explode('@', $handler);
                $controllerClass = "App\\Controller\\" . $controllerName;
                $controller = new $controllerClass();
                $controller->$methodName();
            }
            return;
        }

        http_response_code(404);
        echo "Route introuvable: " . $path;
    }
}

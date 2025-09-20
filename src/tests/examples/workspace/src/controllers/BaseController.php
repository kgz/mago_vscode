<?php 

class BaseController
{

    /**
     * currently a bug in mago where static return types are not properly handled
     * Invalid return type for function `basecontroller::index`: expected `Response`, but found `BaseController`.mago(invalid-return-statement)
     */
    public function index(): Response
    {
        $response = new Response();
        $response = $response->withStatus(200);
        return $response;
    }
}
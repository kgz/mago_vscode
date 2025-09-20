<?php

class Response implements ResponseWithStaticReturnContract
{
    public int $status = 200;

    #[\Override]
    /**
     * This is currently a bug in mago where static return types are not properly handled
     * @return static
     */
    public function withStatus(int $status): static
    {
        // this is an example that can be seen in PSR-7 ResponseInterface
        // where they clone the current instance and modify it so they return a cmpletly new instance
        $response = clone $this; 
        $response->status = $status;
        return $response;
    }


    public function badRequest(self $response)
    {
        $response->status = 400;
        return $response;
    }
}
<?php
 namespace MagoVscode\Tests;

use MagoVscode\Tests\contracts\HelloWorldContract;

class HelloWorld
{

    public function sayHello(string $_name)
    {
        return "Hello, World!";
    }
} 

class HelloWorld2 extends HelloWorld implements HelloWorldContract
{

    #[\Override]
    public function sayHello(int $name)
    {
        return "Hello, World!";
    }
}

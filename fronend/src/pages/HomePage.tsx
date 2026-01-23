import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { APITester } from '../APITester'
import logo from '../logo.svg'
import reactLogo from '../react.svg'

export function HomePage() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <div className="flex justify-center items-center gap-8 mb-8">
        <img
          src={logo}
          className="h-36 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#646cffaa] scale-120"
        />
        <img
          src={reactLogo}
          className="h-36 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] [animation:spin_20s_linear_infinite]"
        />
      </div>
      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-3xl font-bold">DnD Digital Desk</CardTitle>
          <CardDescription>
            Welcome to your DnD Digital Desk application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/register">Зарегестрироваться</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/login">Войти</Link>
            </Button>
          </div>
          <APITester />
        </CardContent>
      </Card>
    </div>
  )
}

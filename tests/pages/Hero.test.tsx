import { useSession } from "next-auth/react"
import Hero from "../../src/pages/Hero";
import { fireEvent, render, screen, waitFor } from '@testing-library/react'


const mockSignin = jest.fn()
jest.mock("next-auth/react",()=>({
    ...jest.requireActual("next-auth/react"),
    signIn: () => mockSignin(),
    useSession: jest.fn(() => ({
        data: null,
        status: 'authenticated'
    })),
    getSession: jest.fn(()=> Promise.resolve())
}))

jest.mock("next/router", () => ({
    useRouter: jest.fn(() => ({
        query: {}
    })),
}))

describe("The Hero Component",()=>{
    it('renders the landing content', async ()=>{
        render(<Hero />)
        expect(await screen.findByText('Get started')).toBeInTheDocument()
    })

    it('will sign the user in with both buttons', async ()=>{
        render(<Hero />)
        const signIn_a = await screen.findByText('Log in With Google')
        fireEvent.click(signIn_a)
        const signIn_b = await screen.findByText('Get started')
        fireEvent.click(signIn_b)
        await waitFor(() => expect(mockSignin).toHaveBeenCalledTimes(2))
    })

    it('shall render the Error page if the user is already logged in', async ()=>{
        (useSession as jest.Mock).mockImplementationOnce(() => ({
            data: 'user is logged in',
        }))
        render(<Hero/>)
        const errorPage = await screen.findByText('Inaccessible Page')
        expect(errorPage).toBeInTheDocument();
    })
})

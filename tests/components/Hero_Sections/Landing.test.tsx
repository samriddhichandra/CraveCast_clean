import Landing from "../../../src/components/Hero_Sections/Landing";
import { render, screen, fireEvent } from '@testing-library/react'

it('The Landing section renders', () => {
    const { container } = render(<Landing onGetStarted={() => { }} />)
    expect(container).toMatchSnapshot()
})

it('Calls onGetStarted when clicking Get started', () => {
    const onGetStarted = jest.fn();
    render(<Landing onGetStarted={onGetStarted} />)
    fireEvent.click(screen.getByText('Get started'));
    expect(onGetStarted).toHaveBeenCalledTimes(1)
})

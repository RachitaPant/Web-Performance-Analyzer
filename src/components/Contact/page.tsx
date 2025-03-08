export default function ContactSection() {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md mt-6 w-full max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-gray-800">Get in Touch</h2>
        <p className="text-gray-600 mt-3">Have questions? Reach out to us for more details.</p>
        <form className="mt-6 flex flex-col gap-4">
          <input type="text" placeholder="Your Name" className="p-3 border text-gray-800 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="email" placeholder="Your Email" className="p-3 border text-gray-800 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea placeholder="Your Message" className="p-3 border text-gray-800 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="4"></textarea>
          <button className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-all">Send Message</button>
        </form>
      </div>
    );
  }